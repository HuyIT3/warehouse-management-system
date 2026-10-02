using Warehouse.Domain.Common;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class GoodsReceipt : BaseEntity
{
    public string ReceiptCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? PoNumber { get; set; }
    public GoodsReceiptStatus Status { get; set; } = GoodsReceiptStatus.DRAFT;
    public int TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Note { get; set; }

    public int CreatedByUserId { get; set; }
    public User CreatedByUser { get; set; } = null!;

    public DateTime? CompletedAt { get; set; }

    public ICollection<GoodsReceiptItem> Items { get; set; } = new List<GoodsReceiptItem>();
}
