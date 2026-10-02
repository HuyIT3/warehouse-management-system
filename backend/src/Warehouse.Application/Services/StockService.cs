using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.Stock;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Services;

public class StockService : IStockService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public StockService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<StockOperationResultDto> StockOutAsync(StockOutRequest request)
    {
        if (request.Quantity <= 0)
            throw new ValidationException("Quantity", "Số lượng xuất kho phải lớn hơn 0.");

        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");

        // Atomic Transaction to guarantee concurrency and consistency
        using var transaction = await _context.BeginTransactionAsync();
        try
        {
            var materialCode = request.MaterialCode.Trim();
            var material = await _context.Materials
                .FirstOrDefaultAsync(m => m.MaterialCode.ToLower() == materialCode.ToLower());

            if (material == null)
                throw new NotFoundException($"Không tìm thấy vật tư có mã '{request.MaterialCode}'.");

            if (!material.IsActive)
                throw new ValidationException("Material", $"Vật tư '{material.MaterialCode}' ({material.Name}) đang ở trạng thái ngừng hoạt động.");

            var locationCode = request.LocationCode.Trim();
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.LocationCode.ToLower() == locationCode.ToLower());

            if (location == null)
                throw new NotFoundException($"Không tìm thấy vị trí có mã '{request.LocationCode}'.");

            if (!location.IsActive)
                throw new ValidationException("Location", $"Vị trí kho '{location.LocationCode}' ({location.DisplayName}) đang bị khóa hoặc ngừng hoạt động.");

            // Fetch inventory row for this material & location
            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.MaterialId == material.Id && i.LocationId == location.Id);

            var currentStock = inventory?.Quantity ?? 0;

            // Strict Stock Availability Check
            if (inventory == null || currentStock < request.Quantity)
            {
                throw new InsufficientStockException(
                    material.MaterialCode,
                    location.DisplayName,
                    currentStock,
                    request.Quantity);
            }

            var beforeQuantity = inventory.Quantity;
            inventory.DecreaseStock(request.Quantity);
            var afterQuantity = inventory.Quantity;

            // Create Audit StockTransaction
            var stockTx = new StockTransaction
            {
                InventoryId = inventory.Id,
                MaterialId = material.Id,
                LocationId = location.Id,
                TransactionType = TransactionType.OUT,
                Quantity = request.Quantity,
                BeforeQuantity = beforeQuantity,
                AfterQuantity = afterQuantity,
                UserId = userId,
                Note = string.IsNullOrWhiteSpace(request.Note) ? "Xuất kho vật tư" : request.Note.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.StockTransactions.Add(stockTx);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var totalRemaining = await _context.Inventories
                .Where(i => i.MaterialId == material.Id)
                .SumAsync(i => i.Quantity);

            return new StockOperationResultDto
            {
                Success = true,
                Message = $"Xuất vật tư '{material.Name}' thành công ({request.Quantity} {material.Unit}).",
                MaterialCode = material.MaterialCode,
                MaterialName = material.Name,
                LocationCode = location.LocationCode,
                LocationDisplayName = location.DisplayName,
                OperationType = TransactionType.OUT,
                QuantityChanged = request.Quantity,
                BeforeQuantity = beforeQuantity,
                AfterQuantity = afterQuantity,
                RemainingTotalStock = totalRemaining,
                TransactionId = stockTx.Id,
                Timestamp = stockTx.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<StockOperationResultDto> StockInAsync(StockInRequest request)
    {
        if (request.Quantity <= 0)
            throw new ValidationException("Quantity", "Số lượng nhập kho phải lớn hơn 0.");

        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");

        using var transaction = await _context.BeginTransactionAsync();
        try
        {
            var materialCode = request.MaterialCode.Trim();
            var material = await _context.Materials
                .FirstOrDefaultAsync(m => m.MaterialCode.ToLower() == materialCode.ToLower());

            if (material == null)
                throw new NotFoundException($"Không tìm thấy vật tư có mã '{request.MaterialCode}'.");

            if (!material.IsActive)
                throw new ValidationException("Material", $"Vật tư '{material.MaterialCode}' đang ngừng hoạt động.");

            var locationCode = request.LocationCode.Trim();
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.LocationCode.ToLower() == locationCode.ToLower());

            if (location == null)
                throw new NotFoundException($"Không tìm thấy vị trí có mã '{request.LocationCode}'.");

            if (!location.IsActive)
                throw new ValidationException("Location", $"Vị trí kho '{location.LocationCode}' đang ngừng hoạt động.");

            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.MaterialId == material.Id && i.LocationId == location.Id);

            int beforeQuantity;
            if (inventory == null)
            {
                beforeQuantity = 0;
                inventory = new Inventory
                {
                    MaterialId = material.Id,
                    LocationId = location.Id,
                    Quantity = request.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Inventories.Add(inventory);
                await _context.SaveChangesAsync(); // save to get generated inventory.Id
            }
            else
            {
                beforeQuantity = inventory.Quantity;
                inventory.IncreaseStock(request.Quantity);
            }

            var afterQuantity = inventory.Quantity;

            var stockTx = new StockTransaction
            {
                InventoryId = inventory.Id,
                MaterialId = material.Id,
                LocationId = location.Id,
                TransactionType = TransactionType.IN,
                Quantity = request.Quantity,
                BeforeQuantity = beforeQuantity,
                AfterQuantity = afterQuantity,
                UserId = userId,
                Note = string.IsNullOrWhiteSpace(request.Note) ? "Nhập kho vật tư" : request.Note.Trim(),
                CreatedAt = DateTime.UtcNow
            };

            _context.StockTransactions.Add(stockTx);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var totalRemaining = await _context.Inventories
                .Where(i => i.MaterialId == material.Id)
                .SumAsync(i => i.Quantity);

            return new StockOperationResultDto
            {
                Success = true,
                Message = $"Nhập kho vật tư '{material.Name}' thành công (+{request.Quantity} {material.Unit}).",
                MaterialCode = material.MaterialCode,
                MaterialName = material.Name,
                LocationCode = location.LocationCode,
                LocationDisplayName = location.DisplayName,
                OperationType = TransactionType.IN,
                QuantityChanged = request.Quantity,
                BeforeQuantity = beforeQuantity,
                AfterQuantity = afterQuantity,
                RemainingTotalStock = totalRemaining,
                TransactionId = stockTx.Id,
                Timestamp = stockTx.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<StockOperationResultDto> StockAdjustAsync(StockAdjustRequest request)
    {
        if (request.ActualQuantity < 0)
            throw new ValidationException("ActualQuantity", "Số lượng kiểm kê thực tế không thể là số âm.");

        if (string.IsNullOrWhiteSpace(request.Reason))
            throw new ValidationException("Reason", "Lý do điều chỉnh tồn kho là bắt buộc để phục vụ kiểm toán.");

        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");

        using var transaction = await _context.BeginTransactionAsync();
        try
        {
            var materialCode = request.MaterialCode.Trim();
            var material = await _context.Materials
                .FirstOrDefaultAsync(m => m.MaterialCode.ToLower() == materialCode.ToLower());

            if (material == null)
                throw new NotFoundException($"Không tìm thấy vật tư có mã '{request.MaterialCode}'.");

            var locationCode = request.LocationCode.Trim();
            var location = await _context.Locations
                .FirstOrDefaultAsync(l => l.LocationCode.ToLower() == locationCode.ToLower());

            if (location == null)
                throw new NotFoundException($"Không tìm thấy vị trí có mã '{request.LocationCode}'.");

            var inventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.MaterialId == material.Id && i.LocationId == location.Id);

            int beforeQuantity;
            if (inventory == null)
            {
                beforeQuantity = 0;
                inventory = new Inventory
                {
                    MaterialId = material.Id,
                    LocationId = location.Id,
                    Quantity = request.ActualQuantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Inventories.Add(inventory);
                await _context.SaveChangesAsync();
            }
            else
            {
                beforeQuantity = inventory.Quantity;
                inventory.AdjustStock(request.ActualQuantity);
            }

            var afterQuantity = inventory.Quantity;
            var diffQuantity = afterQuantity - beforeQuantity;

            var stockTx = new StockTransaction
            {
                InventoryId = inventory.Id,
                MaterialId = material.Id,
                LocationId = location.Id,
                TransactionType = TransactionType.ADJUSTMENT,
                Quantity = Math.Abs(diffQuantity),
                BeforeQuantity = beforeQuantity,
                AfterQuantity = afterQuantity,
                UserId = userId,
                Note = $"[Kiểm kê điều chỉnh] {request.Reason.Trim()} (Chênh lệch: {(diffQuantity >= 0 ? "+" : "")}{diffQuantity})",
                CreatedAt = DateTime.UtcNow
            };

            _context.StockTransactions.Add(stockTx);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var totalRemaining = await _context.Inventories
                .Where(i => i.MaterialId == material.Id)
                .SumAsync(i => i.Quantity);

            return new StockOperationResultDto
            {
                Success = true,
                Message = $"Điều chỉnh tồn kho '{material.Name}' tại {location.DisplayName}: {beforeQuantity} -> {afterQuantity} {material.Unit}.",
                MaterialCode = material.MaterialCode,
                MaterialName = material.Name,
                LocationCode = location.LocationCode,
                LocationDisplayName = location.DisplayName,
                OperationType = TransactionType.ADJUSTMENT,
                QuantityChanged = diffQuantity,
                BeforeQuantity = beforeQuantity,
                AfterQuantity = afterQuantity,
                RemainingTotalStock = totalRemaining,
                TransactionId = stockTx.Id,
                Timestamp = stockTx.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<StockOperationResultDto> StockTransferAsync(StockTransferRequest request)
    {
        if (request.Quantity <= 0)
            throw new ValidationException("Quantity", "Số lượng chuyển vị trí phải lớn hơn 0.");

        if (request.SourceLocationCode.Trim().Equals(request.DestinationLocationCode.Trim(), StringComparison.OrdinalIgnoreCase))
            throw new ValidationException("DestinationLocationCode", "Vị trí đích không được trùng với vị trí nguồn.");

        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");

        using var transaction = await _context.BeginTransactionAsync();
        try
        {
            var material = await _context.Materials
                .FirstOrDefaultAsync(m => m.MaterialCode.ToLower() == request.MaterialCode.Trim().ToLower());

            if (material == null)
                throw new NotFoundException($"Không tìm thấy vật tư có mã '{request.MaterialCode}'.");

            var srcLocation = await _context.Locations
                .FirstOrDefaultAsync(l => l.LocationCode.ToLower() == request.SourceLocationCode.Trim().ToLower());

            if (srcLocation == null)
                throw new NotFoundException($"Không tìm thấy vị trí nguồn có mã '{request.SourceLocationCode}'.");

            var dstLocation = await _context.Locations
                .FirstOrDefaultAsync(l => l.LocationCode.ToLower() == request.DestinationLocationCode.Trim().ToLower());

            if (dstLocation == null)
                throw new NotFoundException($"Không tìm thấy vị trí đích có mã '{request.DestinationLocationCode}'.");

            // Source inventory
            var srcInventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.MaterialId == material.Id && i.LocationId == srcLocation.Id);

            var srcCurrentStock = srcInventory?.Quantity ?? 0;
            if (srcInventory == null || srcCurrentStock < request.Quantity)
            {
                throw new InsufficientStockException(
                    material.MaterialCode,
                    srcLocation.DisplayName,
                    srcCurrentStock,
                    request.Quantity);
            }

            var srcBefore = srcInventory.Quantity;
            srcInventory.DecreaseStock(request.Quantity);
            var srcAfter = srcInventory.Quantity;

            // Dest inventory
            var dstInventory = await _context.Inventories
                .FirstOrDefaultAsync(i => i.MaterialId == material.Id && i.LocationId == dstLocation.Id);

            int dstBefore;
            if (dstInventory == null)
            {
                dstBefore = 0;
                dstInventory = new Inventory
                {
                    MaterialId = material.Id,
                    LocationId = dstLocation.Id,
                    Quantity = request.Quantity,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                _context.Inventories.Add(dstInventory);
                await _context.SaveChangesAsync();
            }
            else
            {
                dstBefore = dstInventory.Quantity;
                dstInventory.IncreaseStock(request.Quantity);
            }

            var dstAfter = dstInventory.Quantity;

            // Create transfer transaction records
            var note = string.IsNullOrWhiteSpace(request.Note)
                ? $"Chuyển vị trí từ {srcLocation.DisplayName} sang {dstLocation.DisplayName}"
                : $"Chuyển vị trí: {request.Note.Trim()} ({srcLocation.DisplayName} -> {dstLocation.DisplayName})";

            var tx = new StockTransaction
            {
                InventoryId = srcInventory.Id,
                MaterialId = material.Id,
                LocationId = srcLocation.Id,
                TransactionType = TransactionType.TRANSFER,
                Quantity = request.Quantity,
                BeforeQuantity = srcBefore,
                AfterQuantity = srcAfter,
                UserId = userId,
                Note = note,
                CreatedAt = DateTime.UtcNow
            };

            _context.StockTransactions.Add(tx);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            var totalRemaining = await _context.Inventories
                .Where(i => i.MaterialId == material.Id)
                .SumAsync(i => i.Quantity);

            return new StockOperationResultDto
            {
                Success = true,
                Message = $"Chuyển thành công {request.Quantity} {material.Unit} từ {srcLocation.DisplayName} sang {dstLocation.DisplayName}.",
                MaterialCode = material.MaterialCode,
                MaterialName = material.Name,
                LocationCode = dstLocation.LocationCode,
                LocationDisplayName = dstLocation.DisplayName,
                OperationType = TransactionType.TRANSFER,
                QuantityChanged = request.Quantity,
                BeforeQuantity = srcBefore,
                AfterQuantity = srcAfter,
                RemainingTotalStock = totalRemaining,
                TransactionId = tx.Id,
                Timestamp = tx.CreatedAt
            };
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }
}
