# QLBH - Hệ Thống Quản Lý Bảo Hiểm (Insurance Management Platform)

Nền tảng quản lý bảo hiểm toàn diện với hỗ trợ theo dõi thanh toán thời gian thực, quản lý hợp đồng, và tích hợp cổng thanh toán VietQR/SePay.

## 🌟 Tính Năng Chính

- ✅ **Quản Lý Hợp Đồng:** Tạo, chỉnh sửa, theo dõi trạng thái hợp đồng bảo hiểm
- ✅ **Theo Dõi Thanh Toán:** Lịch sử đầy đủ các kỳ đóng phí với trạng thái xác nhận, sắp xếp theo ngày thanh toán
- ✅ **Thanh Toán Trực Tiếp:** Mở QR SePay ngay trong trang, quét QR, hệ thống tự cập nhật khi webhook về
- ✅ **Quản Lý Người Dùng:** Admin quản lý tài khoản, phân quyền theo vai trò
- ✅ **Báo Cáo Tài Chính:** Kế toán xuất báo cáo thanh toán, phân tích doanh thu
- ✅ **Giao Diện Người Dùng:** Hỗ trợ chế độ sáng/tối, responsive design
- ✅ **Nhật Ký Hoạt Động:** Theo dõi mọi thay đổi hệ thống (audit log)

## 🏗️ Kiến Trúc

```
QLBH/
├── frontend/                      # React + Vite + shadcn/ui
│   ├── src/
│   │   ├── app/
│   │   │   ├── pages/
│   │   │   │   ├── insured/               # Trang khách hàng bảo hiểm
│   │   │   │   ├── creator/              # Trang người tạo hợp đồng
│   │   │   │   ├── accountant/           # Trang kế toán
│   │   │   │   ├── supervisor/           # Trang giám sát
│   │   │   │   └── admin/                # Trang quản trị
│   │   │   ├── components/               # UI components
│   │   │   │   ├── common/               # Reusable components (Alert, Modal, etc.)
│   │   │   │   ├── layout/               # Layout components (Header, Sidebar)
│   │   │   │   ├── payment/              # Payment-specific components
│   │   │   │   └── ui/                   # shadcn/ui components
│   │   │   ├── contexts/                 # React contexts (Auth)
│   │   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── services/                 # API calls (api.ts)
│   │   │   └── styles/
│   │   │       ├── theme.css             # CSS variables (light/dark mode)
│   │   │       ├── index.css
│   │   │       └── tailwind.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── package.json
│   └── pnpm-lock.yaml
│
├── backend/                       # Node.js API Server
│   ├── src/
│   │   ├── app.js                        # Express app setup
│   │   ├── server.js                     # Server entry point
│   │   ├── config/
│   │   │   ├── db.js                     # Database connection
│   │   │   └── env.js                    # Environment config
│   │   ├── controllers/                  # Request handlers
│   │   │   ├── admin.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── contract.controller.js
│   │   │   ├── customer.controller.js
│   │   │   ├── dashboard.controller.js
│   │   │   ├── employee.controller.js
│   │   │   ├── payment.controller.js
│   │   │   └── settings.controller.js
│   │   ├── models/                       # Database models
│   │   │   ├── contract.model.js
│   │   │   ├── customer.model.js
│   │   │   ├── employee.model.js
│   │   │   └── payment.model.js
│   │   ├── routes/                       # API routes
│   │   │   ├── admin.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── contract.routes.js
│   │   │   ├── customer.routes.js
│   │   │   ├── dashboard.routes.js
│   │   │   ├── employee.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── settings.routes.js
│   │   │   └── index.js
│   │   ├── middlewares/                  # Express middlewares
│   │   │   ├── auth.middleware.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.middleware.js
│   │   ├── utils/                        # Utility functions
│   │   │   ├── asyncHandler.js
│   │   │   ├── loginAuth.js
│   │   │   ├── assignmentScope.js
│   │   │   ├── sepay.js                  # SePay integration
│   │   │   ├── vietqr.js                 # VietQR integration
│   │   │   └── vnpay.js                  # VNPay integration
│   │   └── views/
│   │       └── apiResponse.view.js
│   ├── sql/
│   │   ├── init.sql                      # Database schema
│   │   └── patch_triggers.sql
│   ├── scripts/
│   │   ├── create-admin.js               # Create admin user script
│   │   └── fix-unicode-db.js             # Fix Unicode encoding script
│   ├── package.json
│   ├── pnpm-lock.yaml
│   └── .env.example
│
├── .gitignore
└── README.md
```

## 🚀 Cài Đặt & Chạy

### Yêu Cầu Hệ Thống

- **Node.js:** v16+ hoặc v18+
- **npm/pnpm:** v6+ hoặc v8+
- **SQL Server:** 2016+
- **Git:** Để clone repository

### Backend Setup

```bash
# 1. Điều hướng đến thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install
# Hoặc nếu dùng pnpm:
pnpm install

# 3. Tạo file .env từ template
cp .env.example .env

# 4. Cấu hình .env
# Thay đổi các giá trị:
# - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
# - VIETQR_API_KEY, VIETQR_ACCOUNT_NO, VIETQR_BANK_CODE
# - JWT_SECRET, PORT, NODE_ENV

# 5. Chạy script tạo database (nếu cần)
npm run script:init-db

# 6. Khởi động server
npm run dev
# Server chạy trên: http://localhost:8000
```

**Biến Môi Trường Backend (.env):**

```env
# Database
DB_HOST=localhost
DB_USER=sa
DB_PASSWORD=your_password
DB_NAME=QLBH_DB
DB_PORT=1433

# API Configuration
PORT=8000
NODE_ENV=development

# Authentication
JWT_SECRET=your_super_secret_key_min_32_chars_long
JWT_EXPIRE=7d
REFRESH_TOKEN_EXPIRE=30d

# VietQR & SePay Integration
VIETQR_API_KEY=your_vietqr_api_key
VIETQR_ACCOUNT_NO=123456789
VIETQR_BANK_CODE=970422
VIETQR_ACCOUNT_NAME=Your Account Name
SEPAY_ENV=test  # or 'live' for production

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

### Frontend Setup

```bash
# 1. Điều hướng đến thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install
# Hoặc nếu dùng pnpm:
pnpm install

# 3. Tạo file .env
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env.local

# 4. Khởi động development server
npm run dev
# Frontend chạy trên: http://localhost:5173
```

**Biến Môi Trường Frontend (.env.local):**

```env
# API Server
VITE_API_BASE_URL=http://localhost:8000/api

# App Config (optional)
VITE_APP_NAME=QLBH
VITE_APP_VERSION=1.0.0
```

### Database Setup

Nếu database chưa được tạo:

```bash
cd backend
npm run script:init-db
```

Hoặc chạy file `backend/sql/init.sql` trực tiếp trên SQL Server Management Studio.

## 👥 Các Vai Trò Người Dùng

### **1. CREATOR (Người Tạo Hợp Đồng)**

**Quyền Hạn:**

- Tạo hợp đồng bảo hiểm mới
- Quản lý danh sách khách hàng
- Xem báo cáo hợp đồng của mình
- Chỉnh sửa hợp đồng (trước khi kích hoạt)

**Truy Cập:**

- Dashboard creator
- Trang "Hợp Đồng Của Tôi"
- Trang "Khách Hàng"
- Trang "Báo Cáo"

---

### **2. INSURED (Khách Hàng Bảo Hiểm)**

**Quyền Hạn:**

- Xem hợp đồng của mình
- Thanh toán kỳ phí trực tiếp via SePay
- Theo dõi lịch sử thanh toán
- Xem trạng thái bảo hiểm

**Truy Cập:**

- Dashboard insured
- Trang "Hợp Đồng Của Tôi"
- Trang "Lịch Sử Thanh Toán" (có nút thanh toán SePay)
- Trang "Cài Đặt"

**Luồng Thanh Toán:**

```
1. Vào "Lịch Sử Thanh Toán"
2. Click nút "Thanh Toán SePay" trên kỳ chưa thanh toán
3. Quét QR bằng app ngân hàng
4. Chuyển khoản theo thông tin hiển thị
5. Hệ thống tự động cập nhật khi webhook về (4 giây/lần)
6. Khi thanh toán thành công, QR đóng + hiển thị "Giao dịch thành công"
```

---

### **3. ACCOUNTANT (Kế Toán)**

**Quyền Hạn:**

- Xem tất cả thanh toán
- Xác nhận/từ chối thanh toán từ khách
- Xuất báo cáo tài chính
- Theo dõi doanh thu và chi phí
- Quản lý phương thức thanh toán

**Truy Cập:**

- Dashboard accountant
- Trang "Quản Lý Thanh Toán"
- Trang "Báo Cáo Tài Chính"
- Trang "Cài Đặt"

---

### **4. SUPERVISOR (Giám Sát)**

**Quyền Hạn:**

- Xem bảng điều khiển tổng quan
- Phân tích hợp đồng theo loại, tình trạng
- Theo dõi hiệu suất thanh toán
- Xuất báo cáo phân tích

**Truy Cập:**

- Dashboard supervisor
- Trang "Báo Cáo Tổng Quan"
- Trang "Phân Tích Hợp Đồng"
- Trang "Thống Kê Thanh Toán"

---

### **5. ADMIN (Quản Trị)**

**Quyền Hạn:**

- Quản lý tất cả người dùng
- Quản lý loại bảo hiểm
- Phân công vai trò và quyền hạn
- Xem nhật ký hoạt động hệ thống
- Cấu hình hệ thống

**Truy Cập:**

- Dashboard admin
- Trang "Quản Lý Người Dùng"
- Trang "Quản Lý Loại Bảo Hiểm"
- Trang "Nhật Ký Hoạt Động"
- Trang "Cài Đặt Hệ Thống"

## 💳 Luồng Thanh Toán SePay Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ KHÁCH HÀNG (Insured)                                    │
│ Truy cập: Lịch Sử Thanh Toán                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Click "Thanh Toán SePay" trên kỳ chưa thanh toán        │
│ (Frontend gọi: POST /api/payments/checkout-session)     │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Backend tạo phiên SePay                                 │
│ - Gửi request đến VietQR API                            │
│ - Nhận QR image URL + session ID                        │
│ - Lưu vào database                                      │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend hiển thị QR inline                             │
│ - Hiển thị QR image                                     │
│ - Hiển thị bank code, account number                    │
│ - Hiển thị transfer content (nội dung chuyển khoản)     │
│ - Nút "Copy" để copy transfer content                   │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Khách quét QR bằng app ngân hàng                        │
│ Chuyển khoản (transfer amount = kỳ phí)                 │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ VietQR/SePay xử lý giao dịch                            │
│ → Gửi Webhook tới Backend (URL: /webhook/payment)       │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Backend xử lý webhook                                   │
│ - Xác thực webhook signature                            │
│ - Cập nhật status payment = "PENDING_CONFIRM"           │
│ - Lưu transaction details vào database                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Frontend theo dõi (polling mỗi 4 giây)                  │
│ - GET /api/customers/{id}/payments                      │
│ - Phát hiện payment status thay đổi                     │
│ - Đóng QR, hiển thị "Giao dịch thành công"              │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ KẾ TOÁN xác nhận                                        │
│ Vào Trang "Quản Lý Thanh Toán"                          │
│ → Click "Xác Nhận" trên giao dịch                       │
│ → Status = "CONFIRMED"                                  │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ Giao dịch hoàn tất                                      │
│ Khách hàng sẽ thấy lịch sử thanh toán cập nhật          │
└─────────────────────────────────────────────────────────┘
```

## 🎨 Giao Diện & Styling

- **Framework:** Tailwind CSS 4.1.12
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Theme System:** CSS variables (`--color-*`, `--sidebar-*`, `--radius-*`)
- **Dark Mode:** Tự động chuyển qua cài đặt người dùng hoặc theo hệ thống
- **Icons:** Lucide React (25+ icons)
- **Date Handling:** date-fns 3.6.0
- **Animations:** Motion (Framer Motion alternative) 12.23.24

### Chế Độ Sáng/Tối

Truy cập **Cài Đặt > Giao Diện** để chọn:

- 🌞 **Nền Sáng** — Luôn sáng
- 🌙 **Nền Tối** — Luôn tối
- 🖥️ **Tự Động** — Theo hệ thống

Theme được lưu trong localStorage và áp dụng tự động khi truy cập lại.

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/login                    # Đăng nhập
PUT    /api/auth/password                 # Đổi mật khẩu
PUT    /api/auth/profile                  # Cập nhật thông tin cá nhân
```

### Contracts

```
GET    /api/contracts                     # Danh sách hợp đồng (filtered by role)
POST   /api/contracts                     # Tạo hợp đồng mới
GET    /api/contracts/:id                 # Chi tiết hợp đồng
PUT    /api/contracts/:id                 # Chỉnh sửa hợp đồng
DELETE /api/contracts/:id                 # Xóa hợp đồng
```

### Customers

```
GET    /api/customers                     # Danh sách khách hàng
POST   /api/customers                     # Tạo khách hàng
GET    /api/customers/:id                 # Chi tiết khách hàng
PUT    /api/customers/:id                 # Chỉnh sửa khách hàng
GET    /api/customers/:id/contracts       # Hợp đồng của khách
```

### Payments

```
GET    /api/payments                      # Danh sách tất cả thanh toán
GET    /api/customers/:id/payments        # Thanh toán của khách
POST   /api/payments/checkout-session     # Tạo phiên SePay
GET    /api/payments/:id                  # Chi tiết thanh toán
PUT    /api/payments/:id/confirm          # Kế toán xác nhận thanh toán
```

### Admin

```
GET    /api/admin/users                   # Danh sách người dùng
POST   /api/admin/users                   # Tạo người dùng
PUT    /api/admin/users/:id               # Chỉnh sửa người dùng
DELETE /api/admin/users/:id               # Xóa người dùng
GET    /api/admin/insurance-types         # Danh sách loại bảo hiểm
POST   /api/admin/insurance-types         # Tạo loại bảo hiểm
GET    /api/admin/activity                # Nhật ký hoạt động
```

### Dashboard

```
GET    /api/dashboard/stats               # Thống kê tổng quan
GET    /api/dashboard/revenue             # Doanh thu
GET    /api/dashboard/contracts           # Phân tích hợp đồng
```

## 🔒 Bảo Mật

- **Authentication:** JWT token (access + refresh token)
- **Authorization:** Role-based access control (RBAC) — 5 vai trò khác nhau
- **Database:** SQL Server với parameterized queries (chống SQL injection)
- **API:** HTTPS recommended cho production
- **Password:** Bcrypt hashing với salt
- **CORS:** Configured per environment
- **Validation:** Input validation ở cả frontend và backend

**Token Storage:**

- Access Token: localStorage (XSS risk mitigation: short expiry 7 ngày)
- Refresh Token: httpOnly cookie (chống XSS)

## 📦 Build & Deployment

### Frontend Build

```bash
cd frontend
npm run build
# Output: dist/ folder

# Kiểm tra build
npm run preview
# Xem build result trên http://localhost:4173
```

**Deployment:**

- Netlify: Drag & drop `dist/` folder
- Vercel: Connect GitHub, auto-deploy
- AWS S3 + CloudFront: `aws s3 sync dist/ s3://bucket-name/`
- Azure Static Web Apps: Connect GitHub repository

### Backend Build & Deployment

```bash
cd backend
npm run build
# Hoặc deploy trực tiếp (Node.js không cần build)

npm start
# Production server
```

**Deployment Options:**

- **Local Server:** `npm start` (Node.js + SQL Server local)
- **Azure App Service:** Deploy Node.js app + SQL Database
- **AWS Elastic Beanstalk:** Deploy Node.js environment
- **Docker:** Build image, push to registry, run container

### Environment Configurations

**Development:**

```env
NODE_ENV=development
DEBUG=true
VITE_API_BASE_URL=http://localhost:8000/api
```

**Staging:**

```env
NODE_ENV=staging
VITE_API_BASE_URL=https://staging-api.yourdomain.com
```

**Production:**

```env
NODE_ENV=production
DEBUG=false
VITE_API_BASE_URL=https://api.yourdomain.com
JWT_EXPIRE=7d
```

## 🛠️ Phát Triển

### Cấu Trúc Component

**Frontend:**

- **Pages:** `PageNamePage.tsx` → Route components
- **Components:** `ComponentName.tsx` → Reusable UI components
- **Services:** `api.ts` → API calls (Axios instance)
- **Contexts:** `ContextName.tsx` → Global state (Auth, etc.)
- **Hooks:** `useHookName.ts` → Custom React hooks
- **Types:** Inline TypeScript types hoặc trong `types/` folder

**Backend:**

- **Controllers:** Business logic per resource
- **Models:** Database operations
- **Routes:** Endpoint definitions
- **Middlewares:** Auth, validation, error handling
- **Utils:** Helper functions (VietQR, SePay, Vnpay integration)

### Code Style

**Frontend:**

- React Functional Components (Hooks)
- TypeScript strict mode
- Tailwind utility classes
- Props type safety
- No console.log in production

**Backend:**

- ES6+ async/await
- Express middleware pattern
- Parameterized SQL queries
- Error handling with try-catch
- Validation using middleware

### Git Workflow

```bash
# Feature branch
git checkout -b feature/payment-tracking
# Work...
git commit -m "feat: add inline SePay checkout"
git push origin feature/payment-tracking
# Create Pull Request

# Bugfix branch
git checkout -b fix/dark-mode-contrast
# Work...
git commit -m "fix: brighten dark mode palette for readability"
git push origin fix/dark-mode-contrast

# Commit message format
git commit -m "feat: add new feature"       # New feature
git commit -m "fix: resolve bug"            # Bug fix
git commit -m "docs: update README"         # Documentation
git commit -m "style: format code"          # Code style
git commit -m "refactor: improve code"      # Refactoring
git commit -m "test: add test cases"        # Testing
git commit -m "chore: update dependencies"  # Maintenance
```

### TypeScript

- Use strict mode: `"strict": true` in tsconfig.json
- Define types for API responses
- Type component props explicitly
- Avoid `any` type

### Testing

```bash
# Frontend (Future)
npm run test

# Backend (Future)
npm run test

# Coverage
npm run test:coverage
```

## 📞 Hỗ Trợ & Troubleshooting

### Vấn Đề Thường Gặp

**1. Lỗi kết nối Database**

```
Error: Connection failed
Giải pháp:
- Kiểm tra SQL Server đang chạy
- Kiểm tra credentials trong .env
- Kiểm tra firewall (port 1433)
```

**2. Lỗi CORS**

```
Error: Access to XMLHttpRequest blocked by CORS policy
Giải pháp:
- Kiểm tra CORS_ORIGIN trong backend .env
- Đảm bảo frontend URL được thêm vào whitelist
```

**3. SePay webhook không hoạt động**

```
Giải pháp:
- Kiểm tra SEPAY_ENV matches key type (test vs live)
- Kiểm tra webhook URL public và accessible
- Kiểm tra VietQR API credentials
```

**4. Token hết hạn**

```
Giải pháp:
- Refresh token tự động via middleware
- Nếu vẫn lỗi, đăng nhập lại
- Kiểm tra JWT_SECRET consistent across services
```

### Debug

**Frontend:**

```javascript
// React DevTools
// Vite inspect: npm run dev -- --inspect-brk

// Console logs
console.log("Debug:", variable);

// Network tab
// Xem request/response ở DevTools > Network
```

**Backend:**

```bash
# Enable debug mode
DEBUG=* npm run dev

# Morgan logger
# Tất cả requests được log

# SQL Server logs
# C:\Program Files\Microsoft SQL Server\MSSQL*.SQLEXPRESS\LOG\
```

## 📄 License

MIT License — Xem file `LICENSE` (nếu có)


## 🤝 Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request


**Made with ❤️ by QLBH Team**

_Last Updated: May 2026_
