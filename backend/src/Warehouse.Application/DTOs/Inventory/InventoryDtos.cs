namespace Warehouse.Application.DTOs.Inventory;

public class InventoryDto
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int MinStock { get; set; }

    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string LocationDisplayName { get; set; } = string.Empty;
    public string Rack { get; set; } = string.Empty;
    public int Level { get; set; }
    public string Slot { get; set; } = string.Empty;

    public int Quantity { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class MaterialInventoryLookupDto
{
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int MinStock { get; set; }
    public int TotalStock { get; set; }
    public bool IsActive { get; set; }
    public bool IsLowStock => TotalStock <= MinStock;
    public List<InventoryLocationOptionDto> Locations { get; set; } = new List<InventoryLocationOptionDto>();
}

public class InventoryLocationOptionDto
{
    public int InventoryId { get; set; }
    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string LocationDisplayName { get; set; } = string.Empty;
    public string Rack { get; set; } = string.Empty;
    public int Level { get; set; }
    public string Slot { get; set; } = string.Empty;
    public int Quantity { get; set; }
}
