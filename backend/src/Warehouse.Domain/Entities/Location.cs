using Warehouse.Domain.Common;

namespace Warehouse.Domain.Entities;

public class Location : BaseEntity
{
    public string LocationCode { get; set; } = string.Empty; // e.g. "A01-01" or "A02-03"
    public string Rack { get; set; } = string.Empty;         // e.g. "A", "B"
    public int Level { get; set; }                           // e.g. 1, 2, 3
    public string Slot { get; set; } = string.Empty;         // e.g. "01", "02", "03"
    public string? Description { get; set; }
    public bool IsActive { get; set; } = true;

    // Friendly display name
    public string DisplayName => $"Kệ {Rack} - Tầng {Level} - Ô {Slot}";

    // Navigation properties
    public ICollection<Inventory> Inventories { get; set; } = new List<Inventory>();
    public ICollection<StockTransaction> StockTransactions { get; set; } = new List<StockTransaction>();
}
