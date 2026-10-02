using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.Inventory;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;

namespace Warehouse.Application.Services;

public class InventoryService : IInventoryService
{
    private readonly IApplicationDbContext _context;

    public InventoryService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<InventoryDto>> GetAllAsync(string? search = null, string? rack = null)
    {
        var query = _context.Inventories
            .Include(i => i.Material)
            .Include(i => i.Location)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(i =>
                i.Material.MaterialCode.ToLower().Contains(s) ||
                i.Material.Name.ToLower().Contains(s) ||
                i.Location.LocationCode.ToLower().Contains(s));
        }

        if (!string.IsNullOrWhiteSpace(rack))
        {
            query = query.Where(i => i.Location.Rack.ToUpper() == rack.Trim().ToUpper());
        }

        return await query
            .OrderBy(i => i.Material.MaterialCode)
            .ThenBy(i => i.Location.LocationCode)
            .Select(i => new InventoryDto
            {
                Id = i.Id,
                MaterialId = i.MaterialId,
                MaterialCode = i.Material.MaterialCode,
                MaterialName = i.Material.Name,
                Unit = i.Material.Unit,
                MinStock = i.Material.MinStock,
                LocationId = i.LocationId,
                LocationCode = i.Location.LocationCode,
                LocationDisplayName = i.Location.DisplayName,
                Rack = i.Location.Rack,
                Level = i.Location.Level,
                Slot = i.Location.Slot,
                Quantity = i.Quantity,
                UpdatedAt = i.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<MaterialInventoryLookupDto> LookupByMaterialCodeAsync(string materialCode)
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
            .Where(i => i.Location.IsActive && i.Quantity > 0)
            .OrderBy(i => i.Location.LocationCode)
            .Select(i => new InventoryLocationOptionDto
            {
                InventoryId = i.Id,
                LocationId = i.LocationId,
                LocationCode = i.Location.LocationCode,
                LocationDisplayName = i.Location.DisplayName,
                Rack = i.Location.Rack,
                Level = i.Location.Level,
                Slot = i.Location.Slot,
                Quantity = i.Quantity
            })
            .ToList();

        var totalStock = material.Inventories.Sum(i => i.Quantity);

        return new MaterialInventoryLookupDto
        {
            MaterialId = material.Id,
            MaterialCode = material.MaterialCode,
            Name = material.Name,
            Unit = material.Unit,
            MinStock = material.MinStock,
            TotalStock = totalStock,
            IsActive = material.IsActive,
            Locations = locations
        };
    }
}
