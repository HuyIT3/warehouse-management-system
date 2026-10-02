using Warehouse.Domain.Enums;

namespace Warehouse.Application.DTOs.GoodsReceipts;

public class GoodsReceiptItemDto
{
    public int Id { get; set; }
    public int MaterialId { get; set; }
    public string MaterialCode { get; set; } = string.Empty;
    public string MaterialName { get; set; } = string.Empty;
    public string Unit { get; set; } = string.Empty;
    public int LocationId { get; set; }
    public string LocationCode { get; set; } = string.Empty;
    public string LocationDisplayName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }
    public string? Note { get; set; }
}

public class GoodsReceiptDto
{
    public int Id { get; set; }
    public string ReceiptCode { get; set; } = string.Empty;
    public string SupplierName { get; set; } = string.Empty;
    public string? PoNumber { get; set; }
    public GoodsReceiptStatus Status { get; set; }
    public string StatusName => Status switch
    {
        GoodsReceiptStatus.DRAFT => "Bản nháp",
        GoodsReceiptStatus.COMPLETED => "Đã nhập kho",
        GoodsReceiptStatus.CANCELLED => "Đã hủy",
        _ => Status.ToString()
    };
    public int TotalQuantity { get; set; }
    public decimal TotalAmount { get; set; }
    public string? Note { get; set; }
    public int CreatedByUserId { get; set; }
    public string CreatedByUserName { get; set; } = string.Empty;
    public string CreatedByUserFullName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public List<GoodsReceiptItemDto> Items { get; set; } = new();
}

public class CreateGoodsReceiptItemRequest
{
    public int MaterialId { get; set; }
    public int LocationId { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Note { get; set; }
}

public class CreateGoodsReceiptRequest
{
    public string? ReceiptCode { get; set; }
    public string SupplierName { get; set; } = string.Empty;
    public string? PoNumber { get; set; }
    public string? Note { get; set; }
    public bool AutoStockIn { get; set; } = true;
    public List<CreateGoodsReceiptItemRequest> Items { get; set; } = new();
}

public class GoodsReceiptFilterRequest
{
    public string? Search { get; set; }
    public GoodsReceiptStatus? Status { get; set; }
    public DateTime? FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 15;
}
