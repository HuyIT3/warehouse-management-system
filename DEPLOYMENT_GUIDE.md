# 🚀 Hướng Dẫn Deploy Hệ Thống Warehouse Management System (WMS) Lên Server

Tài liệu này hướng dẫn chi tiết từng bước để đưa hệ thống WMS (.NET 8 Web API + React 19 + MySQL) lên môi trường Server thực tế.

---

## 🌟 PHƯƠNG ÁN 1: Deploy Bằng Docker Compose Trên VPS / Server (Khuyên Dùng Nhất)

Đây là cách chuẩn hóa, an toàn và nhanh nhất. Bạn chỉ cần 1 câu lệnh để khởi chạy toàn bộ:
- 🐬 **MySQL 8.0 Server** (Tự động tạo database, bảng và nạp dữ liệu mẫu)
- 🌐 **phpMyAdmin** (Quản lý database trực quan trên web tại cổng `8080`)
- ⚙️ **Backend ASP.NET Core 8.0 API** (Cổng `5000`)
- 🖥️ **Frontend React 19 + Nginx** (Cổng `80` và `5173`)

---

### Bước 1: Chuẩn bị VPS (Ubuntu 22.04 / 24.04 LTS)
Thuê 1 VPS (Ví dụ: DigitalOcean, Linode, Vultr, AWS, hoặc VPS Việt Nam). Cấu hình tối thiểu: **2 vCPU, 2GB RAM**.

Kết nối SSH vào VPS:
```bash
ssh root@<IP_CUA_SERVER>
```

Cài đặt Docker và Docker Compose (nếu VPS chưa có):
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose plugin
sudo apt install -y docker-compose-plugin
```

---

### Bước 2: Đưa mã nguồn lên VPS
Bạn có thể dùng Git hoặc phần mềm WinSCP / FileZilla:

```bash
# Cách dùng Git:
git clone <URL_REPO_CUA_BAN>
cd "Warehouse Management System (WMS)"
```

---

### Bước 3: Khởi chạy toàn bộ hệ thống bằng Docker Compose

Chạy lệnh duy nhất sau:
```bash
docker compose up -d --build
```

Kiểm tra trạng thái các container đang chạy:
```bash
docker compose ps
```

Nếu thấy 4 dịch vụ `wms-mysql`, `wms-backend`, `wms-frontend`, `wms-phpmyadmin` đều ở trạng thái `Up / Healthy` là thành công!

---

### Bước 4: Truy cập hệ thống trên trình duyệt

| Thành phần | Địa chỉ truy cập | Ghi chú |
| :--- | :--- | :--- |
| 🌐 **Ứng dụng Web WMS** | `http://<IP_SERVER>` | Dùng ngay với 6 tài khoản demo |
| 📚 **Swagger API** | `http://<IP_SERVER>:5000/swagger` | Tài liệu API |
| 🐬 **phpMyAdmin** | `http://<IP_SERVER>:8080` | **User:** `wms_user`<br/>**Password:** `WmsPassword@2026`<br/>**Server:** `mysql` |

---

## 🔒 Cấu Hình Tên Miền (Domain) & HTTPS (SSL Miễn Phí với Certbot)

Nếu bạn có tên miền riêng (ví dụ `kho.yourdomain.com`):

1. Trỏ bản ghi DNS: `A  kho.yourdomain.com  ->  <IP_SERVER>`
2. Cài đặt Nginx & Certbot trên VPS:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d kho.yourdomain.com
```

---

## ☁️ PHƯƠNG ÁN 2: Deploy Miễn Phí Lên Cloud (PaaS) Không Cần VPS

Nếu bạn muốn deploy nhanh để gửi portfolio/CV mà không cần thuê VPS:

1. **Database MySQL miễn phí:**
   - Đăng ký tại **[Aiven.io](https://aiven.io)** hoặc **[Clever Cloud](https://www.clever-cloud.com)** để nhận 1 MySQL Database miễn phí vĩnh viễn.
   - Lấy chuỗi kết nối (Host, Port, User, Password).
2. **Backend Web API:**
   - Đăng ký tài khoản tại **[Render.com](https://render.com)**.
   - Chọn **New Web Service** -> Kết nối GitHub repo -> Chọn thư mục `backend` -> Chọn Environment `Docker`.
   - Thêm biến môi trường:
     - `DatabaseProvider` = `MySql`
     - `ConnectionStrings__MySqlConnection` = `<Chuỗi_kết_nối_Aiven>`
3. **Frontend React:**
   - Đăng ký tại **[Vercel.com](https://vercel.com)**.
   - Import thư mục `frontend` -> Framework: `Vite` -> Deploy.
   - Đổi biến môi trường `VITE_API_BASE_URL` trỏ về link Render Backend.

---

## 🛠️ Các Lệnh Quản Trị Hệ Thống Hữu Ích

```bash
# Xem log thời gian thực của Backend
docker compose logs -f backend

# Xem log của Database MySQL
docker compose logs -f mysql

# Khởi động lại toàn bộ dịch vụ
docker compose restart

# Tắt hệ thống
docker compose down

# Cập nhật code mới và build lại
git pull
docker compose up -d --build
```
