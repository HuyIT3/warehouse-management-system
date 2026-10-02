using Warehouse.Domain.Common;
using Warehouse.Domain.Enums;

namespace Warehouse.Domain.Entities;

public class StockRequest : BaseEntity
{
    public string RequestCode { get; set; } = string.Empty;

    public int MaterialId { get; set; }
    public Material Material { get; set; } = null!;

    public int? LocationId { get; set; }
    public Location? Location { get; set; }

    public int RequestedQuantity { get; set; }

    public int RequestedBy { get; set; }
    public User RequestedByUser { get; set; } = null!;

    public StockRequestStatus Status { get; set; } = StockRequestStatus.PENDING;

    public string? Note { get; set; }

    public DateTime? CompletedAt { get; set; }
}
