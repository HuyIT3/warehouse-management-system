using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.Materials;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Services;

public class MaterialService : IMaterialService
{
    private readonly IApplicationDbContext _context;

    public MaterialService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<MaterialDto>> GetAllAsync(string? search = null, bool? onlyActive = null, bool? lowStockOnly = null)
    {
        var query = _context.Materials
            .Include(m => m.Inventories)
            .AsNoTracking()
            .AsQueryable();

        if (onlyActive.HasValue)
        {
            query = query.Where(m => m.IsActive == onlyActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(m => m.MaterialCode.ToLower().Contains(s) || m.Name.ToLower().Contains(s) || (m.Category != null && m.Category.ToLower().Contains(s)));
        }

        var materials = await query
            .OrderBy(m => m.MaterialCode)
            .Select(m => new MaterialDto
            {
                Id = m.Id,
                MaterialCode = m.MaterialCode,
                Name = m.Name,
                Unit = m.Unit,
                MinStock = m.MinStock,
                Description = m.Description,
                Category = m.Category,
                IsActive = m.IsActive,
                TotalStock = m.Inventories.Sum(i => i.Quantity),
                CreatedAt = m.CreatedAt,
                UpdatedAt = m.UpdatedAt
            })
            .ToListAsync();

        if (lowStockOnly == true)
        {
            materials = materials.Where(m => m.TotalStock <= m.MinStock).ToList();
        }

        return materials;
    }

    public async Task<MaterialDto> GetByIdAsync(int id)
    {
        var material = await _context.Materials
            .Include(m => m.Inventories)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material == null)
            throw new NotFoundException("Vật tư", id);

        return new MaterialDto
        {
            Id = material.Id,
            MaterialCode = material.MaterialCode,
            Name = material.Name,
            Unit = material.Unit,
            MinStock = material.MinStock,
            Description = material.Description,
            Category = material.Category,
            IsActive = material.IsActive,
            TotalStock = material.Inventories.Sum(i => i.Quantity),
            CreatedAt = material.CreatedAt,
            UpdatedAt = material.UpdatedAt
        };
    }

    public async Task<MaterialDto> GetByCodeAsync(string materialCode)
    {
        var code = materialCode.Trim();
        var material = await _context.Materials
            .Include(m => m.Inventories)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.MaterialCode.ToLower() == code.ToLower());

        if (material == null)
            throw new NotFoundException($"Không tìm thấy vật tư có mã '{materialCode}'.");

        return new MaterialDto
        {
            Id = material.Id,
            MaterialCode = material.MaterialCode,
            Name = material.Name,
            Unit = material.Unit,
            MinStock = material.MinStock,
            Description = material.Description,
            Category = material.Category,
            IsActive = material.IsActive,
            TotalStock = material.Inventories.Sum(i => i.Quantity),
            CreatedAt = material.CreatedAt,
            UpdatedAt = material.UpdatedAt
        };
    }

    public async Task<MaterialStockSummaryDto> GetStockSummaryByCodeAsync(string materialCode)
    {
        var code = materialCode.Trim();
        var material = await _context.Materials
            .Include(m => m.Inventories)
                .ThenInclude(i => i.Location)
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.MaterialCode.ToLower() == code.ToLower());

        if (material == null)
            throw new NotFoundException($"Không tìm thấy vật tư có mã '{materialCode}'.");

        var locations = material.Inventories
            .Where(i => i.Location.IsActive)
            .Select(i => new LocationStockDto
            {
                InventoryId = i.Id,
                LocationId = i.LocationId,
                LocationCode = i.Location.LocationCode,
                DisplayName = i.Location.DisplayName,
                Rack = i.Location.Rack,
                Level = i.Location.Level,
                Slot = i.Location.Slot,
                Quantity = i.Quantity,
                LastUpdated = i.UpdatedAt
            })
            .OrderBy(l => l.LocationCode)
            .ToList();

        var totalStock = locations.Sum(l => l.Quantity);

        return new MaterialStockSummaryDto
        {
            MaterialId = material.Id,
            MaterialCode = material.MaterialCode,
            Name = material.Name,
            Unit = material.Unit,
            MinStock = material.MinStock,
            TotalStock = totalStock,
            Locations = locations
        };
    }

    public async Task<MaterialDto> CreateAsync(CreateMaterialRequest request)
    {
        var code = request.MaterialCode.Trim().ToUpper();
        var exists = await _context.Materials.AnyAsync(m => m.MaterialCode.ToLower() == code.ToLower());
        if (exists)
            throw new ConflictException($"Mã vật tư '{code}' đã tồn tại trong hệ thống.");

        var material = new Material
        {
            MaterialCode = code,
            Name = request.Name.Trim(),
            Unit = request.Unit.Trim(),
            MinStock = request.MinStock,
            Description = request.Description?.Trim(),
            Category = request.Category?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Materials.Add(material);
        await _context.SaveChangesAsync();

        return new MaterialDto
        {
            Id = material.Id,
            MaterialCode = material.MaterialCode,
            Name = material.Name,
            Unit = material.Unit,
            MinStock = material.MinStock,
            Description = material.Description,
            Category = material.Category,
            IsActive = material.IsActive,
            TotalStock = 0,
            CreatedAt = material.CreatedAt
        };
    }

    public async Task<MaterialDto> UpdateAsync(int id, UpdateMaterialRequest request)
    {
        var material = await _context.Materials
            .Include(m => m.Inventories)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material == null)
            throw new NotFoundException("Vật tư", id);

        material.Name = request.Name.Trim();
        material.Unit = request.Unit.Trim();
        material.MinStock = request.MinStock;
        material.Description = request.Description?.Trim();
        material.Category = request.Category?.Trim();
        material.IsActive = request.IsActive;
        material.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new MaterialDto
        {
            Id = material.Id,
            MaterialCode = material.MaterialCode,
            Name = material.Name,
            Unit = material.Unit,
            MinStock = material.MinStock,
            Description = material.Description,
            Category = material.Category,
            IsActive = material.IsActive,
            TotalStock = material.Inventories.Sum(i => i.Quantity),
            CreatedAt = material.CreatedAt,
            UpdatedAt = material.UpdatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var material = await _context.Materials
            .Include(m => m.Inventories)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (material == null)
            throw new NotFoundException("Vật tư", id);

        // Check if there is existing inventory quantity
        var hasStock = material.Inventories.Any(i => i.Quantity > 0);
        if (hasStock)
            throw new ValidationException("Material", "Không thể xóa vật tư đang còn số lượng tồn trong kho. Hãy xuất hết tồn kho hoặc vô hiệu hóa vật tư.");

        // Soft delete / deactivate if there are historical transactions
        var hasTransactions = await _context.StockTransactions.AnyAsync(t => t.MaterialId == id);
        if (hasTransactions)
        {
            material.IsActive = false;
            material.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        _context.Materials.Remove(material);
        await _context.SaveChangesAsync();
        return true;
    }
}
