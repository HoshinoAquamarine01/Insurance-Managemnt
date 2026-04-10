# Backend quan ly bao hiem (MongoDB)

Backend Node.js + Express + MongoDB cho de tai quan ly bao hiem.

## Ky thuat bao mat da dung

1. RBAC (Role-Based Access Control)

- Phan quyen theo vai tro: `LAP_HOP_DONG`, `NGUOI_DUOC_BAO_HIEM`, `KE_TOAN`, `GIAM_SAT`, `ADMIN`.
- Gioi han SELECT/UPDATE theo vai tro va pham vi du lieu duoc phan cong.

2. HASH mat khau

- Dung `bcrypt` de bam mat khau truoc khi luu (`passwordHash`).

3. Ma hoa doi xung AES-256-GCM

- Ma hoa du lieu nhay cam trong `InsuredPerson`: dia chi, lich su benh.

4. Chong injection

- Validate input voi `express-validator`.
- Loai bo toan tu doc hai trong payload voi `express-mongo-sanitize`.

5. Auditing

- Ghi nhat ky truy cap vao collection `AccessLog` cho cac hanh dong SELECT/INSERT/UPDATE.

## Cau truc chinh

- `src/models/*`: cac collection theo de tai
- `src/routes/*`: API
- `src/middleware/*`: auth, authorize, validate
- `src/utils/crypto.js`: AES encrypt/decrypt
- `src/services/auditService.js`: ghi audit log

## Chay du an

1. Cai package

```bash
npm install
```

2. Tao file `.env` tu `.env.example`

3. Chay dev

```bash
npm run dev
```

4. Kiem tra health

```bash
GET http://localhost:3000/health
```

## API nhanh

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/insured-persons`
- `GET /api/insured-persons/:id`
- `POST /api/contracts`
- `GET /api/contracts`
- `GET /api/contracts/:id`
- `PATCH /api/contracts/:id`
- `GET /api/me/contracts`
- `GET /api/me/payments`
- `POST /api/admin/insurance-types`
- `POST /api/admin/assignments/accounting`
- `POST /api/admin/assignments/supervisor`
- `GET /api/admin/audit-logs`

## Ghi chu nghiep vu

- Nguoi lap hop dong chi xem/sua hop dong do chinh ho tao.
- Nguoi duoc bao hiem chi xem du lieu cua minh.
- Ke toan/Giam sat chi xem hop dong thuoc loai bao hiem duoc phan cong.
- Du lieu nhay cam cua NDBH duoc ma hoa truoc khi luu DB.
