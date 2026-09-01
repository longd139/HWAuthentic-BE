# HWAuthentic E-Commerce System

Hệ thống E-Commerce bán hàng trực tuyến hỗ trợ Guest Checkout (không cần đăng nhập), theo dõi đơn hàng 3 lớp (Magic Link, Thank You Page, HttpOnly Cookie), khóa tồn kho chống bán lố và lưu vết trạng thái đơn hàng bằng Database Trigger trên PostgreSQL.

---

## 1. Yêu cầu hệ thống

- Node.js: phiên bản >= 18 (Khuyến nghị Node.js 20 hoặc 22 LTS)
- Package Manager: npm >= 9
- Database: PostgreSQL >= 14 (Đang hỗ trợ PostgreSQL 18)

---

## 2. Cấu trúc thư mục dự án

```text
HWAuthentic-BE/
├── prisma/
│   └── schema.prisma       # Schema Prisma ánh xạ 1-1 với PostgreSQL
├── src/
│   ├── config/             # Cấu hình biến môi trường và kết nối Prisma Client
│   ├── controllers/        # Xử lý request và response của API
│   ├── middlewares/        # Middleware xử lý lỗi toàn cục, validate request (Zod)
│   ├── routes/             # Định tuyến các endpoint API
│   ├── services/           # Xử lý nghiệp vụ, Transaction và khóa dòng
│   ├── utils/              # Tiện ích che mờ dữ liệu (Masking), format response
│   ├── app.ts              # Cấu hình Express App, CORS, Cookie Parser
│   └── server.ts           # Khởi chạy HTTP Server và xử lý Graceful Shutdown
├── .env                    # File chứa thông tin kết nối và biến môi trường
├── .env.example            # Mẫu biến môi trường
├── package.json            # Danh sách thư viện và scripts
├── tsconfig.json           # Cấu hình TypeScript
└── README.md
```

---

## 3. Hướng dẫn cài đặt và khởi chạy

### Bước 1: Khởi tạo Cơ sở dữ liệu PostgreSQL

1. Mở pgAdmin, DBeaver hoặc công cụ quản lý PostgreSQL.
2. Tạo cơ sở dữ liệu mới có tên: `ecommerce_db`
   ```sql
   CREATE DATABASE ecommerce_db;
   ```
3. Mở Query Tool tại database `ecommerce_db`, chạy lần lượt 2 tập tin SQL:
   - Chạy file `database/schema.sql` để khởi tạo 6 bảng, hàm, triggers và index.
   - Chạy file `database/seed_and_test.sql` để nạp dữ liệu mẫu (sản phẩm, biến thể size/màu, tồn kho).

### Bước 2: Cấu hình biến môi trường cho Backend

1. Mở file `.env` (dựa theo `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:MAT_KHAU_POSTGRES@localhost:5432/ecommerce_db?schema=public"
   CLIENT_URL="http://localhost:3000"
   TRACKING_COOKIE_NAME="guest_order_tracker"
   COOKIE_SECRET="super-secret-guest-order-key-2026"
   ```

### Bước 3: Cài đặt dependencies và sinh Prisma Client

Mở Terminal tại thư mục Backend và chạy các lệnh sau:

```bash
npm install
npx prisma generate
```

### Bước 4: Khởi chạy Backend

#### Chế độ Phát triển (Development - Tự động tải lại khi đổi mã nguồn):
```bash
npm run dev
```
Server sẽ chạy tại địa chỉ: `http://localhost:5000`

#### Kiểm tra trạng thái hoạt động (Health Check):
Truy cập trình duyệt hoặc gửi HTTP GET tới:
`http://localhost:5000/api/health`

Kết quả trả về mong đợi:
```json
{
  "success": true,
  "message": "Hệ thống hoạt động bình thường",
  "data": {
    "status": "healthy",
    "timestamp": "..."
  }
}
```

#### Tra cứu và Kiểm thử API Trực quan (Swagger UI):
Truy cập đường dẫn:
`http://localhost:5000/api-docs`
Giao diện Swagger cho phép tra cứu tài liệu đặc tả, danh sách tham số và gửi request trực tiếp đến từng API.

#### Công cụ quản trị CSDL trực quan (Prisma Studio):
```bash
npm run prisma:studio
```
Truy cập: `http://localhost:5555` để xem và quản lý dữ liệu các bảng trực tiếp trên giao diện web.

#### Build và chạy bản Production:
```bash
npm run build
npm start
```

---

## 4. Đặc tả các quy tắc nghiệp vụ cốt lõi

1. Guest Checkout: Khách hàng không cần tạo tài khoản, chỉ cần 4 thông tin bắt buộc (Họ tên, Số điện thoại, Email, Địa chỉ nhận hàng).
2. Safe UPSERT Khách hàng: Không tự ý ghi đè Họ tên và Email gốc của khách hàng cũ nếu chưa xác thực, chỉ cập nhật địa chỉ giao hàng gần nhất vào trường `default_address`.
3. Snapshot bất biến: Bảng `Orders` lưu trực tiếp snapshot thông tin người nhận tại thời điểm đặt đơn, đảm bảo tính toàn vẹn lịch sử dù hồ sơ khách hàng có bị chỉnh sửa sau này.
4. Chống bán lố (Overselling): Bắt buộc dùng Database Transaction và kỹ thuật khóa dòng `SELECT ... FOR UPDATE` trên bảng `Product_Variants` trước khi trừ tồn kho.
5. Định giá động: Backend luôn tự tính tổng giá trị đơn hàng dựa trên `COALESCE(price_override, base_price)` từ CSDL, tuyệt đối không sử dụng giá do Frontend truyền lên.
6. Audit Trail tự động: Toàn bộ thay đổi trạng thái đơn hàng được Database Trigger tự động ghi lại 100% vào bảng `Order_Status_Logs`.
7. Bảo mật thông tin: Mã tracking UUID được lưu trong HttpOnly Cookie thay vì LocalStorage để chống XSS. Thông tin cá nhân của khách hàng trả về qua API tracking được che mờ (Data Masking) để chống lộ lọt dữ liệu.
