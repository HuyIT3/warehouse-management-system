using Microsoft.EntityFrameworkCore;
using Warehouse.Application.DTOs.Locations;
using Warehouse.Application.Exceptions;
using Warehouse.Application.Interfaces;
using Warehouse.Domain.Entities;

namespace Warehouse.Application.Services;

public class LocationService : ILocationService
{
    private readonly IApplicationDbContext _context;

    public LocationService(IApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<List<LocationDto>> GetAllAsync(string? rack = null, bool? onlyActive = null)
    {
        var query = _context.Locations
            .Include(l => l.Inventories)
            .AsNoTracking()
            .AsQueryable();

        if (onlyActive.HasValue)
        {
            query = query.Where(l => l.IsActive == onlyActive.Value);
        }

        if (!string.IsNullOrWhiteSpace(rack))
        {
            query = query.Where(l => l.Rack.ToUpper() == rack.Trim().ToUpper());
        }

        return await query
            .OrderBy(l => l.Rack)
            .ThenBy(l => l.Level)
            .ThenBy(l => l.Slot)
            .Select(l => new LocationDto
            {
                Id = l.Id,
                LocationCode = l.LocationCode,
                Rack = l.Rack,
                Level = l.Level,
                Slot = l.Slot,
                Description = l.Description,
                IsActive = l.IsActive,
                TotalStoredItems = l.Inventories.Count(i => i.Quantity > 0),
                TotalQuantityStored = l.Inventories.Sum(i => i.Quantity),
                CreatedAt = l.CreatedAt
            })
            .ToListAsync();
    }

    public async Task<LocationDetailDto> GetByIdAsync(int id)
    {
        var location = await _context.Locations
            .Include(l => l.Inventories)
                .ThenInclude(i => i.Material)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.Id == id);

        if (location == null)
            throw new NotFoundException("Vị trí", id);

        return MapToDetailDto(location);
    }

    public async Task<LocationDetailDto> GetByCodeAsync(string locationCode)
    {
        var code = locationCode.Trim();
        var location = await _context.Locations
            .Include(l => l.Inventories)
                .ThenInclude(i => i.Material)
            .AsNoTracking()
            .FirstOrDefaultAsync(l => l.LocationCode.ToLower() == code.ToLower());

        if (location == null)
            throw new NotFoundException($"Không tìm thấy vị trí có mã '{locationCode}'.");

        return MapToDetailDto(location);
    }

    public async Task<LocationDto> CreateAsync(CreateLocationRequest request)
    {
        var code = request.LocationCode.Trim().ToUpper();
        var exists = await _context.Locations.AnyAsync(l => l.LocationCode.ToLower() == code.ToLower());
        if (exists)
            throw new ConflictException($"Mã vị trí '{code}' đã tồn tại trong hệ thống.");

        var location = new Location
        {
            LocationCode = code,
            Rack = request.Rack.Trim().ToUpper(),
            Level = request.Level,
            Slot = request.Slot.Trim(),
            Description = request.Description?.Trim(),
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Locations.Add(location);
        await _context.SaveChangesAsync();

        return new LocationDto
        {
            Id = location.Id,
            LocationCode = location.LocationCode,
            Rack = location.Rack,
            Level = location.Level,
            Slot = location.Slot,
            Description = location.Description,
            IsActive = location.IsActive,
            TotalStoredItems = 0,
            TotalQuantityStored = 0,
            CreatedAt = location.CreatedAt
        };
    }

    public async Task<LocationDto> UpdateAsync(int id, UpdateLocationRequest request)
    {
        var location = await _context.Locations
            .Include(l => l.Inventories)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (location == null)
            throw new NotFoundException("Vị trí", id);

        location.Rack = request.Rack.Trim().ToUpper();
        location.Level = request.Level;
        location.Slot = request.Slot.Trim();
        location.Description = request.Description?.Trim();
        location.IsActive = request.IsActive;
        location.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        return new LocationDto
        {
            Id = location.Id,
            LocationCode = location.LocationCode,
            Rack = location.Rack,
            Level = location.Level,
            Slot = location.Slot,
            Description = location.Description,
            IsActive = location.IsActive,
            TotalStoredItems = location.Inventories.Count(i => i.Quantity > 0),
            TotalQuantityStored = location.Inventories.Sum(i => i.Quantity),
            CreatedAt = location.CreatedAt
        };
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var location = await _context.Locations
            .Include(l => l.Inventories)
            .FirstOrDefaultAsync(l => l.Id == id);

        if (location == null)
            throw new NotFoundException("Vị trí", id);

        var hasStock = location.Inventories.Any(i => i.Quantity > 0);
        if (hasStock)
            throw new ValidationException("Location", "Không thể xóa vị trí đang có vật tư tồn kho. Vui lòng chuyển hoặc xuất hết vật tư trước.");

        var hasTransactions = await _context.StockTransactions.AnyAsync(t => t.LocationId == id);
        if (hasTransactions)
        {
            location.IsActive = false;
            location.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }

        _context.Locations.Remove(location);
        await _context.SaveChangesAsync();
        return true;
    }

    private static LocationDetailDto MapToDetailDto(Location location)
    {
        var activeInventories = location.Inventories.Where(i => i.Quantity > 0).ToList();

        return new LocationDetailDto
        {
            Id = location.Id,
            LocationCode = location.LocationCode,
            Rack = location.Rack,
            Level = location.Level,
            Slot = location.Slot,
            Description = location.Description,
            IsActive = location.IsActive,
            TotalStoredItems = activeInventories.Count,
            TotalQuantityStored = activeInventories.Sum(i => i.Quantity),
            CreatedAt = location.CreatedAt,
            StoredMaterials = activeInventories.Select(i => new LocationInventoryItemDto
            {
                InventoryId = i.Id,
                MaterialId = i.MaterialId,
                MaterialCode = i.Material.MaterialCode,
                MaterialName = i.Material.Name,
                Unit = i.Material.Unit,
                Quantity = i.Quantity,
                UpdatedAt = i.UpdatedAt
            }).ToList()
        };
    }
}
