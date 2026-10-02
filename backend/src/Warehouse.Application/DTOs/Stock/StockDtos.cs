using Warehouse.Domain.Enums;

namespace Warehouse.Application.DTOs.Stock;

public class StockInRequest
{
    public string MaterialCode { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class StockOutRequest
{
    public string MaterialCode { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class StockAdjustRequest
{
    public string MaterialCode { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public int ActualQuantity { get; set; }
    public string Reason { get; set; } = string.Empty; // Mandatory reason for audit trail!
}

public class StockTransferRequest
{
    public string MaterialCode { get; set; } = string.Empty;
    public string SourceLocationCode { get; set; } = string.Empty;
    public string DestinationLocationCode { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class StockOperationResultDto
{
    public bool Success { get; set; } = true;
    public string Message { get; set; } = string.Empty;
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string LocationCode { get; set; } = string.Empty;
    public string LocationDisplayName { get; set; } = string.Empty;
    public TransactionType OperationType { get; set; }
    public int QuantityChanged { get; set; }
    public int BeforeQuantity { get; set; }
    public int AfterQuantity { get; set; }
    public int RemainingTotalStock { get; set; }
    public int TransactionId { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
}
