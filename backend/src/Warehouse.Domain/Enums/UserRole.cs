namespace Warehouse.Domain.Enums;

public enum UserRole
{
    ADMIN,             // Quản trị hệ thống toàn quyền
    MANAGER,           // Quản lý kho (Duyệt phiếu, quản lý nhân sự, xem toàn bộ báo cáo)
    INBOUND_STAFF,     // Nhân viên chuyên trách Nhập kho (Tạo phiếu nhập, nhận hàng vào ô kệ)
    OUTBOUND_STAFF,    // Nhân viên chuyên trách Xuất kho (Lấy hàng, xuất kho vật tư)
    AUDITOR,           // Nhân viên kiểm kê (Kiểm kê tồn kho, tạo phiếu điều chỉnh)
    WAREHOUSE_STAFF    // Nhân viên kho tổng hợp
}
