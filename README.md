# HWAuthentic E-Commerce System

He thong E-Commerce ban hang truc tuyen ho tro Guest Checkout (khong can dang nhap), theo doi don hang 3 lop (Magic Link, Thank You Page, HttpOnly Cookie), khoa ton kho chong ban lo va luu vet trang thai don hang bang Database Trigger tren PostgreSQL.

---

## 1. Yeu cau he thong

- Node.js: phien ban >= 18 (Khuyen nghi Node.js 20 hoac 22 LTS)
- Package Manager: npm >= 9
- Database: PostgreSQL >= 14 (Dang ho tro PostgreSQL 18)

---

## 2. Cau truc thu muc du an

```text
ProjectBanHang/
├── database/
│   ├── schema.sql              # Tap lenh DDL khoi tao 6 bang, Trigger va Index
│   └── seed_and_test.sql       # Du lieu mau va kich ban kiem thu tinh toan gia / ton kho
├── Prepare/
│   ├── summary.txt             # Tai lieu dac ta nghiep vu va yeu cau ky thuat
│   └── dbdiagramio_hethong.txt # So do thiet ke quan he co so du lieu
├── DOC/                        # Tai lieu mo rong
├── src/
│   └── HWAuthentic-BE/         # Ma nguon Backend (Express + TypeScript + Prisma)
│       ├── prisma/
│       │   └── schema.prisma   # Schema Prisma anh xa 1-1 voi PostgreSQL
│       ├── src/
│       │   ├── config/         # Cau hinh bien moi truong va ket noi Prisma Client
│       │   ├── controllers/    # Xu ly request va response cua API
│       │   ├── middlewares/    # Middleware xu ly loi toan cuc, validate request (Zod)
│       │   ├── routes/         # Dinh tuyen cac endpoint API
│       │   ├── services/       # Xu ly nghiep vu, Transaction va khoa dong
│       │   ├── utils/          # Tien ich che mo du lieu (Masking), format response
│       │   ├── app.ts          # Cau hinh Express App, CORS, Cookie Parser
│       │   └── server.ts       # Khoi chay HTTP Server va xu ly Graceful Shutdown
│       ├── .env                # File chua thong tin ket noi va bien moi truong
│       ├── .env.example        # Mau bien moi truong
│       ├── package.json        # Danh sach thu vien va scripts
│       └── tsconfig.json       # Cau hinh TypeScript
└── README.md
```

---

## 3. Huong dan cai dat va khoi chay

### Buoc 1: Khoi tao Co so du lieu PostgreSQL

1. Mo pgAdmin, DBeaver hoac cong cu quan ly PostgreSQL.
2. Tao co so du lieu moi co ten: `ecommerce_db`
   ```sql
   CREATE DATABASE ecommerce_db;
   ```
3. Mo Query Tool tai database `ecommerce_db`, chay lan luot 2 tap tin SQL:
   - Chay file `database/schema.sql` de khoi tao 6 bang, function, triggers va index.
   - Chay file `database/seed_and_test.sql` de nap du lieu mau (san pham, bien the size/mau, ton kho).

### Buoc 2: Cau hinh bien moi truong cho Backend

1. Di chuyen vao thu muc `src/HWAuthentic-BE`.
2. Tao hoac chinh sua tap tin `.env` (dua theo `.env.example`):
   ```env
   PORT=5000
   NODE_ENV=development
   DATABASE_URL="postgresql://postgres:MAT_KHAU_POSTGRES@localhost:5432/ecommerce_db?schema=public"
   CLIENT_URL="http://localhost:3000"
   TRACKING_COOKIE_NAME="guest_order_tracker"
   COOKIE_SECRET="super-secret-guest-order-key-2026"
   ```

### Buoc 3: Cai dat dependencies va sinh Prisma Client

Mo Terminal tai thu muc `src/HWAuthentic-BE` va chay cac lenh sau:

```bash
cd src/HWAuthentic-BE
npm install
npx prisma generate
```

### Buoc 4: Khoi chay Backend

#### Che do Phat trien (Development - Hot Reload):
```bash
npm run dev
```
Server se chay tai dia chi: `http://localhost:5000`

#### Kiem tra trang thai hoat dong (Health Check):
Truy cap trinh duyet hoac gui HTTP GET toi:
`http://localhost:5000/api/health`

Ket qua tra ve mong doi:
```json
{
  "success": true,
  "message": "He thong hoat dong binh thuong",
  "data": {
    "status": "healthy",
    "timestamp": "..."
  }
}
```

#### Cong cu quan tri CSDL truc quan (Prisma Studio):
```bash
npm run prisma:studio
```
Truy cap: `http://localhost:5555` de xem va quan ly du lieu cac bang truc tiep tren giao dien web.

#### Build va chay ban Production:
```bash
npm run build
npm start
```

---

## 4. Dac ta cac quy tac nghiep vu cot loi

1. Guest Checkout: Khach hang khong can tai khoan, chi can 4 thong tin (Ho ten, So dien thoai, Email, Dia chi nhan hang).
2. Safe UPSERT Khach hang: Khong ghi de Ho ten va Email goc cua khach hang cu, chi cap nhat dia chi giao hang gan nhat vao truong `default_address`.
3. Snapshot bat bien: Bang `Orders` luu truc tiep snapshot thong tin nguoi nhan tai thoi diem dat don, dam bao toan ven lich su du ho so khach hang co thay doi.
4. Chong ban lo (Overselling): Bat buoc dung Database Transaction va khoa dong `SELECT ... FOR UPDATE` tren bang `Product_Variants` truoc khi tru ton kho.
5. Dinh gia dong: Backend luon tinh tong gia tri don dua tren `COALESCE(price_override, base_price)` tu CSDL, khong su dung gia do Frontend truyen len.
6. Audit Trail tu dong: Toan bo thay doi trang thai don hang duoc Database Trigger tu dong ghi lai vao bang `Order_Status_Logs`.
7. Bao mat thong tin: Ma tracking UUID duoc luu trong HttpOnly Cookie thay vi LocalStorage. Thong tin khach hang tra ve qua API tracking duoc che mo (Data Masking) de chong lo lot du lieu.
