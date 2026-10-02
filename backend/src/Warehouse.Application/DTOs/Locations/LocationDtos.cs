namespace Warehouse.Application.DTOs.Locations;

public class LocationDto
{
    public int Id { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string Rack { get; set; } = string.Empty;
    public int Level { get; set; }
    public string Slot { get; set; } = string.Empty;
    public string DisplayName => $"Kệ {Rack} - Tầng {Level} - Ô {Slot}";
    public string? Description { get; set; }
    public bool IsActive { get; set; }
    public int TotalStoredItems { get; set; }
    public int TotalQuantityStored { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateLocationRequest
{
    public string LocationCode { get; set; } = string.Empty;
    public string Rack { get; set; } = string.Empty;
    public int Level { get; set; }
    public string Slot { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class UpdateLocationRequest
{
    public string Rack { get; set; } = string.Empty;
    public int Level { get; set; }
    public string Slot { get; set; } = string.Empty;
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;
}

public class LocationDetailDto : LocationDto
{
    public List<LocationInventoryItemDto> StoredMaterials { get; set; } = new List<LocationInventoryItemDto>();
}

public class LocationInventoryItemDto
{
    public int InventoryId { get; set; }
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
