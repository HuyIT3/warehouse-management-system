using Warehouse.Domain.Enums;

namespace Warehouse.Application.DTOs.Transactions;

public class StockTransactionDto
{
    public int Id { get; set; }
    public int InventoryId { get; set; }
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;

    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string LocationDisplayName { get; set; } = string.Empty;

    public TransactionType TransactionType { get; set; }
    public string TransactionTypeName => TransactionType.ToString();

    public int Quantity { get; set; }
    public int BeforeQuantity { get; set; }
    public int AfterQuantity { get; set; }

    public int UserId { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string UserFullName { get; set; } = string.Empty;

    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class TransactionFilterRequest
{
    public string? MaterialCode { get; set; }
    public string? LocationCode { get; set; }
    public TransactionType? TransactionType { get; set; }
    public int? UserId { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}
