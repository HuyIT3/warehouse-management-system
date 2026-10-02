namespace Warehouse.Application.DTOs.Materials;

public class MaterialDto
{
    public int Id { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int MinStock { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; }
    public int TotalStock { get; set; }
    public bool IsLowStock => TotalStock <= MinStock;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateMaterialRequest
{
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int MinStock { get; set; } = 0;
    public string? Description { get; set; }
    public string? Category { get; set; }
}

public class UpdateMaterialRequest
{
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int MinStock { get; set; } = 0;
    public string? Description { get; set; }
    public string? Category { get; set; }
    public bool IsActive { get; set; } = true;
}

public class MaterialStockSummaryDto
{
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int TotalStock { get; set; }
    public int MinStock { get; set; }
    public bool IsLowStock => TotalStock <= MinStock;
    public List<LocationStockDto> Locations { get; set; } = new List<LocationStockDto>();
}

public class LocationStockDto
{
    public int InventoryId { get; set; }
    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Rack { get; set; } = string.Empty;
    public int Level { get; set; }
    public string Slot { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public DateTime? LastUpdated { get; set; }
}
