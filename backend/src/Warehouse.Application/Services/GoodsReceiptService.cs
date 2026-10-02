using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.GoodsReceipts;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Application.Models;
using Warehouse.Domain.Entities;
using Warehouse.Domain.Enums;

namespace Warehouse.Application.Services;

public class GoodsReceiptService : IGoodsReceiptService
{
    private readonly IApplicationDbContext _context;
    private readonly ICurrentUserService _currentUserService;

    public GoodsReceiptService(IApplicationDbContext context, ICurrentUserService currentUserService)
    {
        _context = context;
        _currentUserService = currentUserService;
    }

    public async Task<PagedResult<GoodsReceiptDto>> GetAllAsync(GoodsReceiptFilterRequest filter)
    {
        var query = _context.GoodsReceipts
            .Include(g => g.CreatedByUser)
            .Include(g => g.Items)
                .ThenInclude(i => i.Material)
            .Include(g => g.Items)
                .ThenInclude(i => i.Location)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(filter.Search))
        {
            var search = filter.Search.Trim().ToLower();
            query = query.Where(g =>
                g.ReceiptCode.ToLower().Contains(search) ||
                g.SupplierName.ToLower().Contains(search) ||
                (g.PoNumber != null && g.PoNumber.ToLower().Contains(search)));
        }

        if (filter.Status.HasValue)
        {
            query = query.Where(g => g.Status == filter.Status.Value);
        }

        if (filter.FromDate.HasValue)
        {
            query = query.Where(g => g.CreatedAt >= filter.FromDate.Value);
        }

        if (filter.ToDate.HasValue)
        {
            var toDateInclusive = filter.ToDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(g => g.CreatedAt <= toDateInclusive);
        }

        var totalCount = await query.CountAsync();

        var pageNumber = filter.PageNumber < 1 ? 1 : filter.PageNumber;
        var pageSize = filter.PageSize < 1 ? 15 : filter.PageSize;

        var items = await query
            .OrderByDescending(g => g.CreatedAt)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .Select(g => MapToDto(g))
            .ToListAsync();

        return new PagedResult<GoodsReceiptDto>
        {
            Items = items,
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };
    }

    public async Task<GoodsReceiptDto> GetByIdAsync(int id)
    {
        var receipt = await _context.GoodsReceipts
            .Include(g => g.CreatedByUser)
            .Include(g => g.Items)
                .ThenInclude(i => i.Material)
            .Include(g => g.Items)
                .ThenInclude(i => i.Location)
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.Id == id);

        if (receipt == null)
            throw new NotFoundException($"Không tìm thấy phiếu nhập kho #{id}.");

        return MapToDto(receipt);
    }

    public async Task<GoodsReceiptDto> CreateAsync(CreateGoodsReceiptRequest request)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Phiên làm việc hết hạn hoặc không hợp lệ.");

        if (string.IsNullOrWhiteSpace(request.SupplierName))
            throw new ValidationException("SupplierName", "Tên nhà cung cấp không được để trống.");

        if (request.Items == null || request.Items.Count == 0)
            throw new ValidationException("Items", "Phiếu nhập kho phải có ít nhất 1 mặt hàng.");

        using var transaction = await _context.BeginTransactionAsync();
        try
        {
            // Auto generate receipt code if not provided
            var receiptCode = string.IsNullOrWhiteSpace(request.ReceiptCode)
                ? $"NK-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}"
                : request.ReceiptCode.Trim().ToUpper();

            var existsCode = await _context.GoodsReceipts.AnyAsync(g => g.ReceiptCode.ToLower() == receiptCode.ToLower());
            if (existsCode)
                throw new ConflictException($"Mã phiếu nhập kho '{receiptCode}' đã tồn tại trong hệ thống.");

            var goodsReceipt = new GoodsReceipt
            {
                ReceiptCode = receiptCode,
                SupplierName = request.SupplierName.Trim(),
                PoNumber = string.IsNullOrWhiteSpace(request.PoNumber) ? null : request.PoNumber.Trim(),
                Note = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim(),
                Status = request.AutoStockIn ? GoodsReceiptStatus.COMPLETED : GoodsReceiptStatus.DRAFT,
                CreatedByUserId = userId,
                CreatedAt = DateTime.UtcNow,
                CompletedAt = request.AutoStockIn ? DateTime.UtcNow : null
            };

            int totalQty = 0;
            decimal totalAmt = 0;

            foreach (var itemReq in request.Items)
            {
                if (itemReq.Quantity <= 0)
                    throw new ValidationException("Quantity", "Số lượng nhập của mỗi mặt hàng phải lớn hơn 0.");

                if (itemReq.UnitPrice < 0)
                    throw new ValidationException("UnitPrice", "Đơn giá nhập không được là số âm.");

                var material = await _context.Materials.FirstOrDefaultAsync(m => m.Id == itemReq.MaterialId);
                if (material == null)
                    throw new NotFoundException($"Không tìm thấy vật tư ID #{itemReq.MaterialId}.");

                var location = await _context.Locations.FirstOrDefaultAsync(l => l.Id == itemReq.LocationId);
                if (location == null)
                    throw new NotFoundException($"Không tìm thấy vị trí ô kệ ID #{itemReq.LocationId}.");

                var itemTotalPrice = itemReq.Quantity * itemReq.UnitPrice;
                totalQty += itemReq.Quantity;
                totalAmt += itemTotalPrice;

                var receiptItem = new GoodsReceiptItem
                {
                    MaterialId = material.Id,
                    LocationId = location.Id,
                    Quantity = itemReq.Quantity,
                    UnitPrice = itemReq.UnitPrice,
                    TotalPrice = itemTotalPrice,
                    Note = itemReq.Note?.Trim()
                };

                goodsReceipt.Items.Add(receiptItem);

                // If AutoStockIn -> immediately update Inventory and log StockTransaction
                if (request.AutoStockIn)
                {
                    var inventory = await _context.Inventories
                        .FirstOrDefaultAsync(i => i.MaterialId == material.Id && i.LocationId == location.Id);

                    int beforeQty = 0;
                    if (inventory == null)
                    {
                        inventory = new Inventory
                        {
                            MaterialId = material.Id,
                            LocationId = location.Id,
                            Quantity = itemReq.Quantity,
                            CreatedAt = DateTime.UtcNow
                        };
                        _context.Inventories.Add(inventory);
                        await _context.SaveChangesAsync();
                    }
                    else
                    {
                        beforeQty = inventory.Quantity;
                        inventory.Quantity += itemReq.Quantity;
                        inventory.UpdatedAt = DateTime.UtcNow;
                    }

                    var stockTx = new StockTransaction
                    {
                        InventoryId = inventory.Id,
                        MaterialId = material.Id,
                        LocationId = location.Id,
                        TransactionType = TransactionType.IN,
                        Quantity = itemReq.Quantity,
                        BeforeQuantity = beforeQty,
                        AfterQuantity = inventory.Quantity,
                        UserId = userId,
                        Note = $"[Nhập kho theo phiếu {receiptCode}] {material.Name} từ NCC: {goodsReceipt.SupplierName}",
                        CreatedAt = DateTime.UtcNow
                    };

                    _context.StockTransactions.Add(stockTx);
                }
            }

            goodsReceipt.TotalQuantity = totalQty;
            goodsReceipt.TotalAmount = totalAmt;

            _context.GoodsReceipts.Add(goodsReceipt);
            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetByIdAsync(goodsReceipt.Id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<GoodsReceiptDto> CompleteReceiptAsync(int id)
    {
        var userId = _currentUserService.UserId ?? throw new UnauthorizedException("Phiên làm việc hết hạn hoặc không hợp lệ.");

        using var transaction = await _context.BeginTransactionAsync();
        try
        {
            var receipt = await _context.GoodsReceipts
                .Include(g => g.Items)
                    .ThenInclude(i => i.Material)
                .Include(g => g.Items)
                    .ThenInclude(i => i.Location)
                .FirstOrDefaultAsync(g => g.Id == id);

            if (receipt == null)
                throw new NotFoundException($"Không tìm thấy phiếu nhập kho #{id}.");

            if (receipt.Status == GoodsReceiptStatus.COMPLETED)
                throw new ValidationException("Status", "Phiếu nhập kho này đã hoàn tất trước đó.");

            if (receipt.Status == GoodsReceiptStatus.CANCELLED)
                throw new ValidationException("Status", "Không thể hoàn tất phiếu nhập kho đã bị hủy.");

            foreach (var item in receipt.Items)
            {
                var inventory = await _context.Inventories
                    .FirstOrDefaultAsync(i => i.MaterialId == item.MaterialId && i.LocationId == item.LocationId);

                int beforeQty = 0;
                if (inventory == null)
                {
                    inventory = new Inventory
                    {
                        MaterialId = item.MaterialId,
                        LocationId = item.LocationId,
                        Quantity = item.Quantity,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Inventories.Add(inventory);
                    await _context.SaveChangesAsync();
                }
                else
                {
                    beforeQty = inventory.Quantity;
                    inventory.Quantity += item.Quantity;
                    inventory.UpdatedAt = DateTime.UtcNow;
                }

                var stockTx = new StockTransaction
                {
                    InventoryId = inventory.Id,
                    MaterialId = item.MaterialId,
                    LocationId = item.LocationId,
                    TransactionType = TransactionType.IN,
                    Quantity = item.Quantity,
                    BeforeQuantity = beforeQty,
                    AfterQuantity = inventory.Quantity,
                    UserId = userId,
                    Note = $"[Hoàn tất nhập kho {receipt.ReceiptCode}] {item.Material.Name} từ NCC: {receipt.SupplierName}",
                    CreatedAt = DateTime.UtcNow
                };

                _context.StockTransactions.Add(stockTx);
            }

            receipt.Status = GoodsReceiptStatus.COMPLETED;
            receipt.CompletedAt = DateTime.UtcNow;
            receipt.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return await GetByIdAsync(receipt.Id);
        }
        catch
        {
            await transaction.RollbackAsync();
            throw;
        }
    }

    public async Task<bool> CancelReceiptAsync(int id)
    {
        var receipt = await _context.GoodsReceipts.FirstOrDefaultAsync(g => g.Id == id);
        if (receipt == null)
            throw new NotFoundException($"Không tìm thấy phiếu nhập kho #{id}.");

        if (receipt.Status == GoodsReceiptStatus.COMPLETED)
            throw new ValidationException("Status", "Không thể hủy phiếu nhập kho đã hoàn tất (tồn kho đã được ghi nhận).");

        receipt.Status = GoodsReceiptStatus.CANCELLED;
        receipt.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();
        return true;
    }

    private static GoodsReceiptDto MapToDto(GoodsReceipt g)
    {
        return new GoodsReceiptDto
        {
            Id = g.Id,
            ReceiptCode = g.ReceiptCode,
            SupplierName = g.SupplierName,
            PoNumber = g.PoNumber,
            Status = g.Status,
            TotalQuantity = g.TotalQuantity,
            TotalAmount = g.TotalAmount,
            Note = g.Note,
            CreatedByUserId = g.CreatedByUserId,
            CreatedByUserName = g.CreatedByUser?.Username ?? string.Empty,
            CreatedByUserFullName = g.CreatedByUser?.FullName ?? string.Empty,
            CreatedAt = g.CreatedAt,
            CompletedAt = g.CompletedAt,
            Items = g.Items.Select(i => new GoodsReceiptItemDto
            {
                Id = i.Id,
                MaterialId = i.MaterialId,
                MaterialCode = i.Material?.MaterialCode ?? string.Empty,
                MaterialName = i.Material?.Name ?? string.Empty,
                Unit = i.Material?.Unit ?? string.Empty,
                LocationId = i.LocationId,
                LocationCode = i.Location?.LocationCode ?? string.Empty,
                LocationDisplayName = i.Location?.DisplayName ?? string.Empty,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice,
                Note = i.Note
            }).ToList()
        };
    }
}
