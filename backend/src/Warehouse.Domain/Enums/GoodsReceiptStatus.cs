namespace Warehouse.Domain.Enums;

public enum GoodsReceiptStatus
{
    DRAFT,       // Phiếu nháp - đang lập hoặc chờ kiểm hàng
    COMPLETED,   // Đã nhập kho - tồn kho đã được cập nhật
    CANCELLED    // Đã hủy bỏ
}
