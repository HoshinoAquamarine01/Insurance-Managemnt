const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../views/apiResponse.view");
const { getPool, sql } = require("../config/db");
const { getAssignedInsuranceTypeIds } = require("../utils/assignmentScope");

const getSummary = asyncHandler(async (req, res) => {
  const pool = await getPool();
  const normalizedRole = String(req.user?.role || "").toLowerCase();
  const userId = req.user?.id;

  // Special handling for insured users - show only their own contracts and payments
  if (normalizedRole === "insured") {
    const insuredResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId).query(`
        SELECT
          COUNT(*) AS TONGHOPDONG,
          SUM(CASE 
            WHEN H.NGAYKETTHUC < CAST(GETDATE() AS DATE) THEN 0
            WHEN H.TRANGTHAI = N'Còn thời hạn' THEN 1 
            ELSE 0 
          END) AS DANGHOATDONG,
          SUM(CASE WHEN H.TRANGTHAI = N'Chờ duyệt' THEN 1 ELSE 0 END) AS CHODUYET,
          SUM(CASE WHEN H.NGAYKETTHUC < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) AS DAPHET
        FROM HOPDONG H
        JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
        WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG
      `);

    const recentContractsResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId).query(`
        SELECT TOP 5
          H.IDHOPDONG, H.SOHOPDONG, NDB.IDNGUOIDUOCBH, NDB.HOTEN AS TENKHACHHANG,
          ND.IDNGUOIDUNG, ND.HOTEN AS TENNHANVIEN,
          H.IDLOAI, LB.TENLOAI, H.NGAYBATDAU, H.NGAYKETTHUC, H.GIATRI,
          CASE 
            WHEN H.NGAYKETTHUC < CAST(GETDATE() AS DATE) THEN N'Đã hết hạn'
            ELSE ISNULL(H.TRANGTHAI, N'Còn thời hạn')
          END AS TRANGTHAI
        FROM HOPDONG H
        JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
        JOIN NGUOIDUNG ND ON H.IDNGUOITAO = ND.IDNGUOIDUNG
        JOIN LOAIBAOHIEM LB ON H.IDLOAI = LB.IDLOAI
        WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG
        ORDER BY H.NGAYBATDAU DESC
      `);

    const recentPaymentsResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId).query(`
        SELECT TOP 5
          K.IDKY, K.IDHOPDONG, H.SOHOPDONG, NDB.HOTEN AS TENKHACHHANG,
          K.SOKY, K.NGAYDENHAN, K.SOTIENPHAIDONG, K.TRANGTHAI,
          T.NGAYTHANHTOAN, T.SOTIEN AS SOTIENDATHANHTOAN, T.PHUONGTHUC
        FROM KYDONGPHI K
        JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
        JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
        LEFT JOIN THANHTOAN T ON K.IDKY = T.IDKY
        WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG
        ORDER BY K.NGAYDENHAN DESC
      `);

    const contractsByTypeResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId).query(`
        SELECT LB.TENLOAI, COUNT(H.IDHOPDONG) AS SOLUONG
        FROM LOAIBAOHIEM LB
        LEFT JOIN HOPDONG H ON H.IDLOAI = LB.IDLOAI
        LEFT JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
        WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG OR H.IDHOPDONG IS NULL
        GROUP BY LB.TENLOAI
        ORDER BY COUNT(H.IDHOPDONG) DESC
      `);

    const paymentSummaryResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId).query(`
        SELECT
          COUNT(*) AS TONGSOPHIEU,
          COALESCE(SUM(CAST(K.SOTIENPHAIDONG AS BIGINT)), 0) AS TONGTIEN,
          COALESCE(SUM(CASE WHEN K.TRANGTHAI IN (N'Đã đóng', N'Đã xác nhận') THEN CAST(K.SOTIENPHAIDONG AS BIGINT) ELSE 0 END), 0) AS DATHU,
          COALESCE(SUM(CASE WHEN K.TRANGTHAI NOT IN (N'Đã đóng', N'Đã xác nhận') THEN CAST(K.SOTIENPHAIDONG AS BIGINT) ELSE 0 END), 0) AS CHUATHU
        FROM KYDONGPHI K
        JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
        JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
        WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG
      `);

    return success(
      res,
      {
        contracts: insuredResult.recordset[0] || {},
        payments: paymentSummaryResult.recordset[0] || {},
        employees: { TONGNHANVIEN: 0 },
        customers: { TONGKHACHHANG: 0 },
        recentContracts: recentContractsResult.recordset,
        recentPayments: recentPaymentsResult.recordset,
        contractsByType: contractsByTypeResult.recordset,
      },
      "Dashboard summary fetched",
    );
  }

  const assignedTypeIds = await getAssignedInsuranceTypeIds(
    pool,
    userId,
    normalizedRole,
  );

  if (Array.isArray(assignedTypeIds) && assignedTypeIds.length === 0) {
    return success(
      res,
      {
        contracts: {
          TONGHOPDONG: 0,
          DANGHOATDONG: 0,
          CHODUYET: 0,
          DAPHET: 0,
        },
        payments: {
          TONGSOPHIEU: 0,
          TONGTIEN: 0,
          DATHU: 0,
          CHUATHU: 0,
        },
        employees: { TONGNHANVIEN: 0 },
        customers: { TONGKHACHHANG: 0 },
        recentContracts: [],
        recentPayments: [],
        contractsByType: [],
      },
      "Dashboard summary fetched",
    );
  }

  const hasScope = Array.isArray(assignedTypeIds);
  const scopedIdsCsv = hasScope ? assignedTypeIds.join(",") : null;
  const contractScope = hasScope
    ? `
      AND H.IDLOAI IN (
        SELECT TRY_CAST([value] AS BIGINT)
        FROM STRING_SPLIT(@ASSIGNED_IDS, ',')
      )
    `
    : "";

  function createScopedRequest() {
    const request = pool.request();
    if (hasScope) {
      request.input("ASSIGNED_IDS", sql.VarChar(sql.MAX), scopedIdsCsv);
    }
    return request;
  }

  const contractsResult = await createScopedRequest().query(`
    SELECT
      COUNT(*) AS TONGHOPDONG,
      SUM(CASE 
        WHEN H.NGAYKETTHUC < CAST(GETDATE() AS DATE) THEN 0
        WHEN H.TRANGTHAI = N'Còn thời hạn' THEN 1 
        ELSE 0 
      END) AS DANGHOATDONG,
      SUM(CASE WHEN H.TRANGTHAI = N'Chờ duyệt' THEN 1 ELSE 0 END) AS CHODUYET,
      SUM(CASE WHEN H.NGAYKETTHUC < CAST(GETDATE() AS DATE) THEN 1 ELSE 0 END) AS DAPHET
    FROM HOPDONG H
    WHERE 1 = 1
    ${contractScope}
  `);

  const recentContractsResult = await createScopedRequest().query(`
    SELECT TOP 5
      H.IDHOPDONG, H.SOHOPDONG, NDB.IDNGUOIDUOCBH, NDB.HOTEN AS TENKHACHHANG,
      ND.IDNGUOIDUNG, ND.HOTEN AS TENNHANVIEN,
      H.IDLOAI, LB.TENLOAI, H.NGAYBATDAU, H.NGAYKETTHUC, H.GIATRI,
      CASE 
        WHEN H.NGAYKETTHUC < CAST(GETDATE() AS DATE) THEN N'Đã hết hạn'
        ELSE ISNULL(H.TRANGTHAI, N'Còn thời hạn')
      END AS TRANGTHAI
    FROM HOPDONG H
    JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
    JOIN NGUOIDUNG ND ON H.IDNGUOITAO = ND.IDNGUOIDUNG
    JOIN LOAIBAOHIEM LB ON H.IDLOAI = LB.IDLOAI
    WHERE 1 = 1
    ${contractScope}
    ORDER BY H.NGAYBATDAU DESC
  `);

  const recentPaymentsResult = await createScopedRequest().query(`
    SELECT TOP 5
      K.IDKY, K.IDHOPDONG, H.SOHOPDONG, NDB.HOTEN AS TENKHACHHANG,
      K.SOKY, K.NGAYDENHAN, K.SOTIENPHAIDONG, K.TRANGTHAI,
      T.NGAYTHANHTOAN, T.SOTIEN AS SOTIENDATHANHTOAN, T.PHUONGTHUC
    FROM KYDONGPHI K
    JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
    JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
    LEFT JOIN THANHTOAN T ON K.IDKY = T.IDKY
    WHERE 1 = 1
    ${contractScope}
    ORDER BY K.NGAYDENHAN DESC
  `);

  const contractsByTypeResult = await createScopedRequest().query(`
    SELECT LB.TENLOAI, COUNT(H.IDHOPDONG) AS SOLUONG
    FROM LOAIBAOHIEM LB
    LEFT JOIN HOPDONG H ON H.IDLOAI = LB.IDLOAI
    ${hasScope ? "WHERE LB.IDLOAI IN (SELECT TRY_CAST([value] AS BIGINT) FROM STRING_SPLIT(@ASSIGNED_IDS, ','))" : ""}
    GROUP BY LB.TENLOAI
    ORDER BY COUNT(H.IDHOPDONG) DESC
  `);

  const paymentSummaryResult = await createScopedRequest().query(`
    SELECT
      COUNT(*) AS TONGSOPHIEU,
      COALESCE(SUM(CAST(K.SOTIENPHAIDONG AS BIGINT)), 0) AS TONGTIEN,
      COALESCE(SUM(CASE WHEN K.TRANGTHAI IN (N'Đã đóng', N'Đã xác nhận') THEN CAST(K.SOTIENPHAIDONG AS BIGINT) ELSE 0 END), 0) AS DATHU,
      COALESCE(SUM(CASE WHEN K.TRANGTHAI NOT IN (N'Đã đóng', N'Đã xác nhận') THEN CAST(K.SOTIENPHAIDONG AS BIGINT) ELSE 0 END), 0) AS CHUATHU,
      COALESCE(SUM(CASE WHEN K.TRANGTHAI IN (N'Đã đóng', N'Đã xác nhận') THEN 1 ELSE 0 END), 0) AS KIYADONG
    FROM KYDONGPHI K
    JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
    WHERE 1 = 1
    ${contractScope}
  `);

  let employeeResult;
  let customerResult;

  if (hasScope) {
    employeeResult = await createScopedRequest().query(`
      SELECT COUNT(DISTINCT H.IDNGUOITAO) AS TONGNHANVIEN
      FROM HOPDONG H
      WHERE 1 = 1
      ${contractScope}
    `);

    customerResult = await createScopedRequest().query(`
      SELECT COUNT(DISTINCT H.IDNGUOIDUOCBH) AS TONGKHACHHANG
      FROM HOPDONG H
      WHERE 1 = 1
      ${contractScope}
    `);
  } else {
    employeeResult = await pool.request().query(`
      SELECT COUNT(*) AS TONGNHANVIEN FROM NGUOIDUNG
      WHERE IDVAITRO IN (SELECT IDVAITRO FROM VAITRO WHERE MAVAITRO IN ('CREATOR', 'ACCOUNTANT', 'SUPERVISOR', 'ADMIN'))
    `);

    customerResult = await pool.request().query(`
      SELECT COUNT(*) AS TONGKHACHHANG FROM NGUOIDUNG
      WHERE IDVAITRO IN (SELECT IDVAITRO FROM VAITRO WHERE MAVAITRO = 'INSURED')
    `);
  }

  return success(
    res,
    {
      contracts: contractsResult.recordset[0] || {},
      payments: paymentSummaryResult.recordset[0] || {},
      employees: employeeResult.recordset[0] || {},
      customers: customerResult.recordset[0] || {},
      recentContracts: recentContractsResult.recordset,
      recentPayments: recentPaymentsResult.recordset,
      contractsByType: contractsByTypeResult.recordset,
    },
    "Dashboard summary fetched",
  );
});

module.exports = {
  getSummary,
};
