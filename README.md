# 🏢 Warehouse & Material Management System (WMS Pro)
> **Hệ Thống Quản Lý Kho & Vật Tư Công Nghiệp (Clean Architecture .NET 8 & React TypeScript)**

[![.NET 8](https://img.shields.io/badge/.NET-8.0-512BD4?logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/)
[![Clean Architecture](https://img.shields.io/badge/Architecture-Clean%20Architecture-blue)](https://blog.cleancoder.com/)
[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%2B%20TypeScript-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/CSS-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Tests](https://img.shields.io/badge/xUnit-8%20Passed%20(100%25)-brightgreen)](https://xunit.net/)

---

## 🎯 Giới Thiệu Dự Án

**Warehouse Management System (WMS Pro)** là hệ thống quản lý kho & vật tư thực tế được thiết kế chuyên biệt cho các nhà máy, xưởng sản xuất và kho công nghiệp.

Dự án áp dụng **Clean Architecture** chuẩn mực trên nền **C# / ASP.NET Core 8 Web API** kết hợp giao diện **Mobile-First React + TypeScript + Tailwind CSS**, tối ưu hóa cho nhân viên kho thực hiện các thao tác nhập xuất bằng điện thoại/tablet ngay tại các ô kệ kho.

---

## 🏛️ Kiến Trúc Hệ Thống (Clean Architecture)

```
WarehouseManagement
│
├── backend/
│   ├── src/
│   │   ├── Warehouse.Domain/          # Entities (User, Material, Location, Inventory, StockTransaction)
│   │   ├── Warehouse.Application/     # DTOs, Business Services, FluentValidation, Exceptions
│   │   ├── Warehouse.Infrastructure/  # EF Core, DbContext, JWT Token Service, BCrypt, SQLite / SQL Server
│   │   └── Warehouse.Api/             # REST API Controllers, Middlewares, Swagger OpenAPI, Serilog
│   └── tests/
│       └── Warehouse.Tests/           # xUnit Unit & Integration Tests (Moq, FluentAssertions)
│
└── frontend/                          # React + TypeScript + Tailwind CSS (Vite)
    ├── src/
    │   ├── api/                       # Typed Axios API Client with JWT interceptors
    │   ├── components/                # Layout, StatCard, Badge, Modal, Shelf Visual Map
    │   ├── context/                   # AuthContext with persistent role-based auth
    │   ├── pages/                     # Dashboard, MobileStockOut, MobileStockIn, Materials, Locations, Inventory, Transactions, Users
    │   └── types/                     # TypeScript Domain Models & Request/Response DTOs
```

---

## 🚀 Tính Năng Chính & Nghiệp Vụ Thực Tế

### 1. 📱 Quy Trình Xuất Kho Nhanh (Mobile-First Workflow)
- **Bước 1:** Nhân viên tới vị trí ô kệ, mở điện thoại gõ mã vật tư (VD: `VT001`).
- **Bước 2:** Hệ thống tra cứu và hiển thị trực quan thông tin vật tư, các ô kệ đang chứa (VD: `Kệ A - Tầng 1 - Ô 01`, tồn 50 cái).
- **Bước 3:** Nhân viên nhập số lượng xuất (VD: 10).
- **Bước 4 (Backend Validation & Transaction):**
  - Kiểm tra `Quantity > 0` và `Quantity <= CurrentStock`.
  - Kiểm tra trạng thái hoạt động của Vật tư và Vị trí kho (`IsActive == true`).
  - Thực hiện giao dịch nguyên tử (**Atomic Database Transaction**) với cơ chế kiểm soát tranh chấp (**Concurrency Token**).
  - Tự động ghi vết vào bảng **`StockTransactions`** (`OUT`, số lượng, trước: 50, sau: 40, người thực hiện, thời gian).
- **Bước 5:** Phản hồi tức thì, hiển thị hiệu ứng hoàn thành và cập nhật tổng tồn kho.

### 2. 📦 Quy Trình Nhập Kho (Stock In)
- Cho phép nhập hàng vào bất kỳ ô kệ nào trong kho (`Kệ A`, `Kệ B`, `Kệ C`).
- Nếu vật tư chưa từng nằm ở ô đó, hệ thống tự động khởi tạo bản ghi phân bổ `Inventory`.
- Ghi vết `IN` vào `StockTransactions`.

### 3. 🔍 Điều Chỉnh Tồn Kho & Kiểm Kê (Stock Adjust)
- Quản trị viên điều chỉnh số tồn thực tế sau khi kiểm kê.
- **Bắt buộc nhập lý do điều chỉnh** để phục vụ kiểm toán (Audit Trail).
- Ghi vết `ADJUSTMENT` kèm chênh lệch `±N`.

### 4. 🔄 Luân Chuyển Vị Trí Ô Kệ (Stock Transfer)
- Chuyển vật tư từ ô nguồn sang ô đích trong kho.
- Kiểm tra tính hợp lệ và cập nhật đồng thời 2 vị trí trong 1 giao dịch.

### 5. 🗺️ Sơ Đồ Trực Quan Ô Kệ Kho (Interactive Shelf Map)
- Trực quan hóa cấu trúc **Kệ (Rack) → Tầng (Level) → Ô (Slot)**.
- Đèn LED trạng thái báo ô có hàng hay trống.
- Bấm vào bất kỳ ô nào để xem ngay danh sách các loại vật tư và số lượng đang lưu trữ bên trong.

### 6. 📊 Dashboard Thời Gian Thực & Cảnh Báo MinStock
- Tổng số loại vật tư, tổng lượng tồn, tỷ lệ lấp đầy kho.
- Cảnh báo vật tư chạm ngưỡng tối thiểu (**Low Stock Alert**).
- Biểu đồ biến động xuất / nhập 7 ngày gần nhất.
- Bảng nhật ký biến động gần nhất.

### 7. 📑 Xuất File CSV Lịch Sử Biến Động
- Bộ lọc theo Thời gian, Mã vật tư, Vị trí kho, Loại giao dịch (`IN`, `OUT`, `ADJUSTMENT`, `TRANSFER`).
- Hỗ trợ tải file CSV mã hóa chuẩn UTF-8 hiển thị tiếng Việt hoàn hảo trên Microsoft Excel.

---

## 👥 Tài Khoản Mẫu Để Trải Nghiệm (Demo Accounts)

| Vai Trò | Tên đăng nhập | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- |
| **Quản Trị Viên (ADMIN)** | `admin` | `Admin@123` | Toàn quyền quản trị, thêm/sửa/xóa vật tư, vị trí, điều chỉnh kiểm kê, quản lý người dùng |
| **Nhân Viên Kho (STAFF)** | `staff1` | `Staff@123` | Xuất kho, nhập kho, luân chuyển vị trí, tra cứu tồn kho, xem lịch sử giao dịch |
| **Nhân Viên Kho (STAFF 2)** | `staff2` | `Staff@123` | Nhân viên vận hành kho 2 |

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Hệ Thống

### Yêu Cầu
- [.NET 8.0 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)
- [Node.js v18+](https://nodejs.org/) & npm

### 1. Khởi Chạy Backend API
```powershell
cd backend/src/Warehouse.Api
dotnet run --urls "http://localhost:5000"
```
- Swagger OpenAPI: [http://localhost:5000/swagger](http://localhost:5000/swagger)
- Health Check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### 2. Khởi Chạy Frontend Web App
```powershell
cd frontend
npm install
npm run dev
```
- Truy cập giao diện tại: [http://localhost:5173](http://localhost:5173)

### 3. Chạy Toàn Bộ Unit Tests
```powershell
cd backend
dotnet test
```

---

## 🐳 Docker Deployment

```powershell
cd backend
docker build -t warehouse-api:latest .
docker run -d -p 5000:5000 --name warehouse-api warehouse-api:latest
```
