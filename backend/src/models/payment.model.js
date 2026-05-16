const { getPool, sql } = require("../config/db");
const { getAssignedInsuranceTypeIds } = require("../utils/assignmentScope");

function normalizePaidStatus(value) {
  return String(value || "").toLowerCase();
}

async function getInstallmentByIdForInsured(idKy, insuredUserId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDKY", sql.BigInt, idKy)
    .input("IDNGUOIDUNG", sql.BigInt, insuredUserId).query(`
      SELECT TOP 1
        K.IDKY,
        K.IDHOPDONG,
        H.SOHOPDONG,
        NDB.IDNGUOIDUNG,
        NDB.HOTEN AS TENKHACHHANG,
        K.SOKY,
        K.NGAYDENHAN,
        K.SOTIENPHAIDONG,
        K.TRANGTHAI,
        T.IDTHANHTOAN,
        T.NGAYTHANHTOAN,
        T.SOTIEN,
        T.PHUONGTHUC,
        T.MACHUNGTU,
        T.TRANGTHAI AS TRANGTHAI_THANHTOAN,
        T.NGUOIXACNHAN,
        T.NGAYXACNHAN,
        T.GHICHU
      FROM KYDONGPHI K
      JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
      JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
      LEFT JOIN THANHTOAN T ON K.IDKY = T.IDKY
      WHERE K.IDKY = @IDKY AND NDB.IDNGUOIDUNG = @IDNGUOIDUNG
    `);

  return result.recordset[0] || null;
}

async function confirmInstallmentPayment({
  idKy,
  insuredUserId,
  amount,
  gatewayRef,
  method,
}) {
  const pool = await getPool();

  const installment = await getInstallmentByIdForInsured(idKy, insuredUserId);
  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const existingPayment = await pool.request().input("IDKY", sql.BigInt, idKy)
    .query(`
      SELECT TOP 1 IDTHANHTOAN, TRANGTHAI
      FROM THANHTOAN
      WHERE IDKY = @IDKY
      ORDER BY ISNULL(NGAYXACNHAN, NGAYTHANHTOAN) DESC, IDTHANHTOAN DESC
    `);

  const alreadyConfirmed = existingPayment.recordset[0];
  if (
    alreadyConfirmed &&
    normalizePaidStatus(alreadyConfirmed.TRANGTHAI).includes("đã")
  ) {
    return {
      alreadyConfirmed: true,
      payment: installment,
    };
  }

  const confirmedAt = new Date();

  if (alreadyConfirmed) {
    await pool
      .request()
      .input("IDTHANHTOAN", sql.BigInt, alreadyConfirmed.IDTHANHTOAN)
      .input("SOTIEN", sql.Decimal(18, 2), amount)
      .input("PHUONGTHUC", sql.NVarChar(50), method || "SePay")
      .input("MACHUNGTU", sql.VarChar(100), gatewayRef || null)
      .input("TRANGTHAI", sql.NVarChar(20), "Chờ kế toán xác nhận")
      .input("NGUOIXACNHAN", sql.BigInt, null)
      .input("NGAYTHANHTOAN", sql.DateTime, confirmedAt)
      .input("NGAYXACNHAN", sql.DateTime, null)
      .input("GHICHU", sql.NVarChar(300), null).query(`
        UPDATE THANHTOAN
        SET SOTIEN = @SOTIEN,
            PHUONGTHUC = @PHUONGTHUC,
            MACHUNGTU = @MACHUNGTU,
            TRANGTHAI = @TRANGTHAI,
            NGAYTHANHTOAN = @NGAYTHANHTOAN,
            NGAYXACNHAN = @NGAYXACNHAN,
            GHICHU = @GHICHU
        WHERE IDTHANHTOAN = @IDTHANHTOAN
      `);
  } else {
    await pool
      .request()
      .input("IDKY", sql.BigInt, idKy)
      .input("SOTIEN", sql.Decimal(18, 2), amount)
      .input("PHUONGTHUC", sql.NVarChar(50), method || "SePay")
      .input("MACHUNGTU", sql.VarChar(100), gatewayRef || null)
      .input("TRANGTHAI", sql.NVarChar(20), "Chờ kế toán xác nhận")
      .input("NGUOIXACNHAN", sql.BigInt, null)
      .input("NGAYTHANHTOAN", sql.DateTime, confirmedAt)
      .input("NGAYXACNHAN", sql.DateTime, null)
      .input("GHICHU", sql.NVarChar(300), null).query(`
        INSERT INTO THANHTOAN (
          IDKY, NGAYTHANHTOAN, SOTIEN, PHUONGTHUC,
          MACHUNGTU, TRANGTHAI, NGUOIXACNHAN, NGAYXACNHAN, GHICHU
        )
        VALUES (
          @IDKY, @NGAYTHANHTOAN, @SOTIEN, @PHUONGTHUC,
          @MACHUNGTU, @TRANGTHAI, @NGUOIXACNHAN, @NGAYXACNHAN, @GHICHU
        )
      `);
  }

  await pool.request().input("IDKY", sql.BigInt, idKy).query(`
      UPDATE KYDONGPHI
      SET TRANGTHAI = N'Chờ kế toán xác nhận',
          NGAYCAPNHAT = GETDATE()
      WHERE IDKY = @IDKY
    `);

  return {
    alreadyConfirmed: false,
    payment: await getInstallmentByIdForInsured(idKy, insuredUserId),
  };
}

async function confirmPaymentByAccountant({ paymentId, accountantId }) {
  const pool = await getPool();

  const paymentResult = await pool
    .request()
    .input("IDTHANHTOAN", sql.BigInt, paymentId).query(`
      SELECT TOP 1
        T.IDTHANHTOAN,
        T.IDKY,
        T.TRANGTHAI,
        T.SOTIEN,
        K.IDHOPDONG,
        K.SOKY,
        K.TRANGTHAI AS TRANGTHAI_KY
      FROM THANHTOAN T
      JOIN KYDONGPHI K ON T.IDKY = K.IDKY
      WHERE T.IDTHANHTOAN = @IDTHANHTOAN
    `);

  const payment = paymentResult.recordset[0];
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  const normalizedStatus = normalizePaidStatus(payment.TRANGTHAI);
  if (normalizedStatus.includes("đã") && normalizedStatus.includes("xác")) {
    return { alreadyConfirmed: true };
  }

  const confirmedAt = new Date();
  await pool
    .request()
    .input("IDTHANHTOAN", sql.BigInt, paymentId)
    .input("NGUOIXACNHAN", sql.BigInt, accountantId)
    .input("NGAYXACNHAN", sql.DateTime, confirmedAt)
    .input("TRANGTHAI", sql.NVarChar(20), "Đã xác nhận").query(`
      UPDATE THANHTOAN
      SET NGUOIXACNHAN = @NGUOIXACNHAN,
          NGAYXACNHAN = @NGAYXACNHAN,
          TRANGTHAI = @TRANGTHAI
      WHERE IDTHANHTOAN = @IDTHANHTOAN
    `);

  await pool.request().input("IDKY", sql.BigInt, payment.IDKY).query(`
      UPDATE KYDONGPHI
      SET TRANGTHAI = N'Đã đóng',
          NGAYCAPNHAT = GETDATE()
      WHERE IDKY = @IDKY
    `);

  return { alreadyConfirmed: false };
}

async function cancelPaymentByAccountant({ paymentId, accountantId }) {
  const pool = await getPool();

  const paymentResult = await pool
    .request()
    .input("IDTHANHTOAN", sql.BigInt, paymentId).query(`
      SELECT TOP 1
        T.IDTHANHTOAN,
        T.IDKY,
        T.TRANGTHAI
      FROM THANHTOAN T
      WHERE T.IDTHANHTOAN = @IDTHANHTOAN
    `);

  const payment = paymentResult.recordset[0];
  if (!payment) {
    const error = new Error("Payment not found");
    error.statusCode = 404;
    throw error;
  }

  const normalizedStatus = normalizePaidStatus(payment.TRANGTHAI);
  if (normalizedStatus.includes("hủy") || normalizedStatus.includes("huy")) {
    return { alreadyCancelled: true };
  }

  const wasConfirmed = normalizedStatus.includes("xác nhận");
  const cancelNote = wasConfirmed
    ? "Kế toán hủy xác nhận thanh toán"
    : "Kế toán hủy thanh toán";

  await pool
    .request()
    .input("IDTHANHTOAN", sql.BigInt, paymentId)
    .input("NGUOIXACNHAN", sql.BigInt, accountantId)
    .input("NGAYXACNHAN", sql.DateTime, new Date())
    .input("TRANGTHAI", sql.NVarChar(20), "Đã hủy")
    .input("GHICHU", sql.NVarChar(300), cancelNote).query(`
      UPDATE THANHTOAN
      SET NGUOIXACNHAN = @NGUOIXACNHAN,
          NGAYXACNHAN = @NGAYXACNHAN,
          TRANGTHAI = @TRANGTHAI,
          GHICHU = COALESCE(@GHICHU, GHICHU)
      WHERE IDTHANHTOAN = @IDTHANHTOAN
    `);

  await pool.request().input("IDKY", sql.BigInt, payment.IDKY).query(`
      UPDATE KYDONGPHI
      SET TRANGTHAI = N'Chưa đóng',
          NGAYCAPNHAT = GETDATE()
      WHERE IDKY = @IDKY
    `);

  return { alreadyCancelled: false };
}

async function createPendingInstallmentPayment({
  idKy,
  insuredUserId,
  amount,
  gatewayRef,
  method,
  description,
  setPaidDate = true,
}) {
  const pool = await getPool();
  const installment = await getInstallmentByIdForInsured(idKy, insuredUserId);

  if (!installment) {
    const error = new Error("Installment not found");
    error.statusCode = 404;
    throw error;
  }

  const existingPayment = await pool.request().input("IDKY", sql.BigInt, idKy)
    .query(`
      SELECT TOP 1 IDTHANHTOAN, TRANGTHAI
      FROM THANHTOAN
      WHERE IDKY = @IDKY
      ORDER BY ISNULL(NGAYXACNHAN, NGAYTHANHTOAN) DESC, IDTHANHTOAN DESC
    `);

  const current = existingPayment.recordset[0] || null;
  if (current) {
    const normalizedStatus = normalizePaidStatus(current.TRANGTHAI);
    if (
      normalizedStatus.includes("chờ") ||
      normalizedStatus.includes("cho") ||
      normalizedStatus.includes("đã") ||
      normalizedStatus.includes("da")
    ) {
      return {
        payment: await getInstallmentByIdForInsured(idKy, insuredUserId),
      };
    }
  }

  const ngayanThanhToanValue = setPaidDate ? new Date() : null;

  await pool
    .request()
    .input("IDKY", sql.BigInt, idKy)
    .input("NGAYTHANHTOAN", sql.DateTime, ngayanThanhToanValue)
    .input("SOTIEN", sql.Decimal(18, 2), amount)
    .input("PHUONGTHUC", sql.NVarChar(50), method || "SePay")
    .input("MACHUNGTU", sql.VarChar(100), gatewayRef || null)
    .input("TRANGTHAI", sql.NVarChar(20), "Chờ kế toán xác nhận")
    .input("NGUOIXACNHAN", sql.BigInt, null)
    .input("NGAYXACNHAN", sql.DateTime, null)
    .input("GHICHU", sql.NVarChar(300), description || null).query(`
      INSERT INTO THANHTOAN (
        IDKY, NGAYTHANHTOAN, SOTIEN, PHUONGTHUC,
        MACHUNGTU, TRANGTHAI, NGUOIXACNHAN, NGAYXACNHAN, GHICHU
      )
      VALUES (
        @IDKY, @NGAYTHANHTOAN, @SOTIEN, @PHUONGTHUC,
        @MACHUNGTU, @TRANGTHAI, @NGUOIXACNHAN, @NGAYXACNHAN, @GHICHU
      )
    `);

  return { payment: await getInstallmentByIdForInsured(idKy, insuredUserId) };
}

async function createUnmatchedPayment({ amount, gatewayRef, method, note }) {
  const pool = await getPool();

  await pool
    .request()
    .input("NGAYTHANHTOAN", sql.DateTime, new Date())
    .input("SOTIEN", sql.Decimal(18, 2), amount)
    .input("PHUONGTHUC", sql.NVarChar(50), method || "SePay")
    .input("MACHUNGTU", sql.VarChar(100), gatewayRef || null)
    .input("TRANGTHAI", sql.NVarChar(20), "Chờ kế toán xác nhận")
    .input("NGUOIXACNHAN", sql.BigInt, null)
    .input("NGAYXACNHAN", sql.DateTime, null)
    .input("GHICHU", sql.NVarChar(300), note || null).query(`
      INSERT INTO THANHTOAN (
        IDKY, NGAYTHANHTOAN, SOTIEN, PHUONGTHUC,
        MACHUNGTU, TRANGTHAI, NGUOIXACNHAN, NGAYXACNHAN, GHICHU
      )
      VALUES (
        NULL, @NGAYTHANHTOAN, @SOTIEN, @PHUONGTHUC,
        @MACHUNGTU, @TRANGTHAI, @NGUOIXACNHAN, @NGAYXACNHAN, @GHICHU
      )
    `);

  return { recorded: true };
}

async function createSePayCheckoutRecord({
  orderRef,
  idKy,
  insuredUserId,
  amount,
  gatewayOrderId,
}) {
  const pool = await getPool();

  await pool.request().query(`
    IF OBJECT_ID(N'dbo.SEPAY_CHECKOUTS', N'U') IS NULL
    BEGIN
      CREATE TABLE dbo.SEPAY_CHECKOUTS (
        ID INT IDENTITY(1,1) PRIMARY KEY,
        ORDER_REF VARCHAR(200) NOT NULL,
        IDKY BIGINT NULL,
        IDNGUOIDUNG BIGINT NULL,
        AMOUNT DECIMAL(18,2) NOT NULL,
        GATEWAY_ORDER_ID VARCHAR(200) NULL,
        MATCHED BIT DEFAULT 0,
        CREATED_AT DATETIME NOT NULL
      );
    END
  `);

  await pool
    .request()
    .input("ORDER_REF", sql.VarChar(200), String(orderRef || "").trim())
    .input("IDKY", sql.BigInt, idKy || null)
    .input("IDNGUOIDUNG", sql.BigInt, insuredUserId || null)
    .input("AMOUNT", sql.Decimal(18, 2), amount || 0)
    .input("GATEWAY_ORDER_ID", sql.VarChar(200), gatewayOrderId || null)
    .input("CREATED_AT", sql.DateTime, new Date()).query(`
      INSERT INTO dbo.SEPAY_CHECKOUTS (
        ORDER_REF, IDKY, IDNGUOIDUNG, AMOUNT, GATEWAY_ORDER_ID, CREATED_AT
      ) VALUES (
        @ORDER_REF, @IDKY, @IDNGUOIDUNG, @AMOUNT, @GATEWAY_ORDER_ID, @CREATED_AT
      )
    `);

  return { recorded: true };
}

async function findSePayCheckoutByAmount(amount) {
  const pool = await getPool();
  const normalizedAmount = Math.round(Number(amount || 0));
  if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
    return null;
  }

  const result = await pool
    .request()
    .input("AMOUNT", sql.Decimal(18, 2), normalizedAmount).query(`
      SELECT TOP 1 ORDER_REF, IDKY, IDNGUOIDUNG, AMOUNT
      FROM dbo.SEPAY_CHECKOUTS
      WHERE AMOUNT = @AMOUNT
        AND (MATCHED = 0 OR MATCHED IS NULL)
        AND CREATED_AT >= DATEADD(DAY, -7, GETDATE())
      ORDER BY CREATED_AT DESC
    `);

  return result.recordset[0] || null;
}

async function findSePayCheckoutByGatewayOrderId(gatewayOrderId) {
  const pool = await getPool();
  const normalizedId = String(gatewayOrderId || "").trim();
  if (!normalizedId) {
    return null;
  }

  const result = await pool.request().input("GATEWAY_ORDER_ID", normalizedId)
    .query(`
      SELECT TOP 1 ORDER_REF, IDKY, IDNGUOIDUNG, AMOUNT, GATEWAY_ORDER_ID
      FROM dbo.SEPAY_CHECKOUTS
      WHERE GATEWAY_ORDER_ID = @GATEWAY_ORDER_ID
        AND CREATED_AT >= DATEADD(DAY, -7, GETDATE())
      ORDER BY CREATED_AT DESC
    `);

  return result.recordset[0] || null;
}

async function markSePayCheckoutMatched({ orderRef, id }) {
  const pool = await getPool();
  if (orderRef) {
    await pool
      .request()
      .input("ORDER_REF", sql.VarChar(200), String(orderRef).trim()).query(`
        UPDATE dbo.SEPAY_CHECKOUTS
        SET MATCHED = 1
        WHERE ORDER_REF = @ORDER_REF
      `);
    return;
  }

  if (id) {
    await pool.request().input("ID", sql.Int, id).query(`
        UPDATE dbo.SEPAY_CHECKOUTS
        SET MATCHED = 1
        WHERE ID = @ID
      `);
  }
}

async function getAllPayments(user) {
  const pool = await getPool();

  const assignedTypeIds = await getAssignedInsuranceTypeIds(
    pool,
    user?.id,
    user?.role,
  );

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

  if (hasScope && assignedTypeIds.length === 0) {
    return [];
  }

  const request = pool.request();
  if (hasScope) {
    request.input("ASSIGNED_IDS", sql.VarChar(sql.MAX), scopedIdsCsv);
  }

  const result = await request.query(`
    SELECT K.IDKY, K.IDHOPDONG, H.SOHOPDONG, NDB.HOTEN AS TENKHACHHANG,
           K.SOKY, K.NGAYDENHAN, K.SOTIENPHAIDONG, K.TRANGTHAI,
           T.IDTHANHTOAN, T.NGAYTHANHTOAN, T.SOTIEN, T.PHUONGTHUC, T.MACHUNGTU,
           T.TRANGTHAI AS TRANGTHAI_THANHTOAN, T.NGUOIXACNHAN
    FROM KYDONGPHI K
    JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
    JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
    LEFT JOIN THANHTOAN T ON K.IDKY = T.IDKY
    WHERE 1=1
    ${contractScope}
    ORDER BY K.NGAYDENHAN DESC
  `);

  return result.recordset;
}

async function getPaymentSummary(user) {
  const pool = await getPool();

  // Get scoped insurance type IDs if user has a scoped role
  const assignedTypeIds = await getAssignedInsuranceTypeIds(
    pool,
    user?.id,
    user?.role,
  );

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

  if (hasScope && assignedTypeIds.length === 0) {
    return { TONGSOPHIEU: 0, TONGTIEN: 0, DATHU: 0, CHUATHU: 0 };
  }

  const request = pool.request();
  if (hasScope) {
    request.input("ASSIGNED_IDS", sql.VarChar(sql.MAX), scopedIdsCsv);
  }

  const result = await request.query(`
    SELECT
      COUNT(*) AS TONGSOPHIEU,
      SUM(CAST(K.SOTIENPHAIDONG AS BIGINT)) AS TONGTIEN,
      SUM(CASE WHEN K.TRANGTHAI IN (N'Đã đóng', N'Đã xác nhận') THEN CAST(K.SOTIENPHAIDONG AS BIGINT) ELSE 0 END) AS DATHU,
      SUM(CASE WHEN K.TRANGTHAI NOT IN (N'Đã đóng', N'Đã xác nhận') THEN CAST(K.SOTIENPHAIDONG AS BIGINT) ELSE 0 END) AS CHUATHU
    FROM KYDONGPHI K
    JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
    WHERE 1=1
    ${contractScope}
  `);

  return (
    result.recordset[0] || { TONGSOPHIEU: 0, TONGTIEN: 0, DATHU: 0, CHUATHU: 0 }
  );
}

module.exports = {
  getAllPayments,
  getPaymentSummary,
  getInstallmentByIdForInsured,
  confirmInstallmentPayment,
  confirmPaymentByAccountant,
  cancelPaymentByAccountant,
  createPendingInstallmentPayment,
  createUnmatchedPayment,
  createSePayCheckoutRecord,
  findSePayCheckoutByAmount,
  markSePayCheckoutMatched,
};
