# QLBH Backend (MVC + SQL Server)

Backend API theo kiến truc MVC ro rang:

- Model: truy van SQL Server qua `mssql`
- View: response JSON thong nhat
- Controller: xu ly nghiep vu
- Router: khai bao endpoint
- Middleware: validate, role-check, error handler

## 1) Cai dat

```bash
npm install
cp .env.example .env
```

Cap nhat `.env` voi thong tin SQL Server cua ban.

Neu SQL Server cua ban dang dung Windows Authentication, dat:

```env
DB_AUTH_MODE=windows
DB_SERVER=localhost
DB_NAME=QLBH
```

## 2) Tao bang

Chay script trong `sql/init.sql` tren SQL Server.

## 3) Chay server

```bash
npm run dev
```

API base: `http://localhost:5000/api`

## 4) Endpoint chinh

- `GET /api/health`
- `POST /api/employees/login`
- `GET /api/employees` (x-role: admin|giamsat)
- `POST /api/employees` (x-role: admin)
- `GET /api/customers` (x-role: admin|giamsat|lap_hop_dong)
- `POST /api/customers` (x-role: admin|lap_hop_dong)
- `GET /api/contracts` (x-role: admin|giamsat)
- `POST /api/contracts` (x-role: admin|lap_hop_dong)

## 5) Bao mat da ap dung

- Parameterized query: chong SQL injection
- Hash mat khau SHA2_512 voi `HASHBYTES`
- Role check tai middleware va role DB co ban trong `init.sql`
