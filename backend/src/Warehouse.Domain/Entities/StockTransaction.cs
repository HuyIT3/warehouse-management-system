using Warehouse.Domain.Common;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class StockTransaction : BaseEntity
{
    public int InventoryId { get; set; }
    public Inventory Inventory { get; set; } = null!;

    public int MaterialId { get; set; }
    public Material Material { get; set; } = null!;

    public int LocationId { get; set; }
    public Location Location { get; set; } = null!;

    public TransactionType TransactionType { get; set; }

    public int Quantity { get; set; }

    public int BeforeQuantity { get; set; }

    public int AfterQuantity { get; set; }

    public int UserId { get; set; }
    public User User { get; set; } = null!;

    public string? Note { get; set; }
}
