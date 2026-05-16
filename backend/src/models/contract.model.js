const { getPool, sql } = require("../config/db");
const { getAssignedInsuranceTypeIds } = require("../utils/assignmentScope");

function addMonths(dateValue, months) {
  const result = new Date(dateValue);
  const targetDay = result.getDate();
  result.setMonth(result.getMonth() + months);

  // Keep end-of-month dates stable when the target month is shorter.
  if (result.getDate() < targetDay) {
    result.setDate(0);
  }

  return result;
}

async function createInstallmentSchedule({
  pool,
  contractId,
  startDate,
  endDate,
  contractValue,
  periodAmount,
}) {
  const totalAmount = Number(contractValue || 0);
  const installmentAmount = Number(periodAmount || 0);

  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Giá trị hợp đồng không hợp lệ");
  }

  if (!Number.isFinite(installmentAmount) || installmentAmount <= 0) {
    throw new Error("Giá trị mỗi kỳ không hợp lệ");
  }

  const parsedStart = new Date(startDate);
  const parsedEnd = new Date(endDate);
  if (
    Number.isNaN(parsedStart.getTime()) ||
    Number.isNaN(parsedEnd.getTime())
  ) {
    throw new Error("Ngày hiệu lực hợp đồng không hợp lệ");
  }

  const installmentCount = Math.max(
    1,
    Math.ceil(totalAmount / installmentAmount),
  );
  const remainingDays = Math.max(
    1,
    Math.round(
      (parsedEnd.getTime() - parsedStart.getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const dayStep = Math.max(1, Math.floor(remainingDays / installmentCount));

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    for (let index = 0; index < installmentCount; index += 1) {
      const scheduledAmount =
        index === installmentCount - 1
          ? totalAmount - installmentAmount * (installmentCount - 1)
          : installmentAmount;
      const dueDate = addMonths(parsedStart, 0);
      dueDate.setDate(dueDate.getDate() + index * dayStep);

      await transaction
        .request()
        .input("IDHOPDONG", sql.BigInt, contractId)
        .input("SOKY", sql.Int, index + 1)
        .input("NGAYDENHAN", sql.Date, dueDate)
        .input("SOTIENPHAIDONG", sql.Decimal(18, 2), scheduledAmount)
        .input("TRANGTHAI", sql.NVarChar(20), "Chưa đóng").query(`
          INSERT INTO KYDONGPHI (
            IDHOPDONG,
            SOKY,
            NGAYDENHAN,
            SOTIENPHAIDONG,
            TRANGTHAI,
            NGAYCAPNHAT
          )
          VALUES (
            @IDHOPDONG,
            @SOKY,
            @NGAYDENHAN,
            @SOTIENPHAIDONG,
            @TRANGTHAI,
            GETDATE()
          )
        `);
    }

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function replaceInstallmentSchedule({
  pool,
  contractId,
  startDate,
  endDate,
  contractValue,
  periodAmount,
}) {
  const paymentCheck = await pool
    .request()
    .input("IDHOPDONG", sql.BigInt, contractId).query(`
      SELECT TOP 1 1 AS HASPAYMENT
      FROM THANHTOAN T
      INNER JOIN KYDONGPHI K ON T.IDKY = K.IDKY
      WHERE K.IDHOPDONG = @IDHOPDONG
    `);

  if (paymentCheck.recordset[0]) {
    throw new Error(
      "Không thể chia lại kỳ phí vì hợp đồng đã có thanh toán. Hãy xử lý thanh toán trước.",
    );
  }

  const transaction = pool.transaction();
  await transaction.begin();

  try {
    await transaction
      .request()
      .input("IDHOPDONG", sql.BigInt, contractId)
      .query(`DELETE FROM KYDONGPHI WHERE IDHOPDONG = @IDHOPDONG`);

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  await createInstallmentSchedule({
    pool,
    contractId,
    startDate,
    endDate,
    contractValue,
    periodAmount,
  });
}

async function buildContractScope(pool, userContext = {}) {
  const role = String(userContext.role || "").toLowerCase();
  const userId = userContext.id;

  if (role === "creator" || role === "lap_hop_dong") {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return { condition: "1=0", request: pool.request() };
    }

    return {
      condition: "H.IDNGUOITAO = @USER_ID",
      request: pool.request().input("USER_ID", sql.BigInt, numericUserId),
    };
  }

  if (role === "insured") {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return { condition: "1=0", request: pool.request() };
    }

    // In the DB, H.IDNGUOIDUOCBH references NGUOIDUOCBAOHIEM.IDNGUOIDUOCBH
    // which is linked to NGUOIDUNG via NDB.IDNGUOIDUNG. Scope by the
    // insured user's NGUOIDUNG id so that logged-in insured users can see
    // their own contracts.
    return {
      condition: "NDB.IDNGUOIDUNG = @USER_ID",
      request: pool.request().input("USER_ID", sql.BigInt, numericUserId),
    };
  }

  const assignedTypeIds = await getAssignedInsuranceTypeIds(pool, userId, role);

  if (Array.isArray(assignedTypeIds)) {
    if (assignedTypeIds.length === 0) {
      return { condition: "1=0", request: pool.request() };
    }

    return {
      condition:
        "H.IDLOAI IN (SELECT TRY_CAST([value] AS BIGINT) FROM STRING_SPLIT(@ASSIGNED_IDS, ','))",
      request: pool
        .request()
        .input("ASSIGNED_IDS", sql.VarChar(sql.MAX), assignedTypeIds.join(",")),
    };
  }

  return { condition: "1=1", request: pool.request() };
}

async function getAllContracts(userContext = {}) {
  const pool = await getPool();
  const { condition, request } = await buildContractScope(pool, userContext);

  const result = await request.query(`
    SELECT
      H.IDHOPDONG,
      H.SOHOPDONG,
      H.IDNGUOIDUOCBH,
      NDB.IDNGUOIDUNG AS IDNGUOIDUNG_BAOHIEM,
      NDB.HOTEN AS TENKHACHHANG,
      H.IDNGUOITAO,
      ND.IDNGUOIDUNG,
      ND.HOTEN AS TENNHANVIEN,
      H.IDLOAI,
      L.TENLOAI,
      H.NGAYBATDAU,
      H.NGAYKETTHUC,
      H.GIATRI,
      (
        SELECT TOP 1 K.SOTIENPHAIDONG
        FROM KYDONGPHI K
        WHERE K.IDHOPDONG = H.IDHOPDONG
        ORDER BY K.SOKY ASC, K.IDKY ASC
      ) AS SOTIENMOIKY,
      H.TRANGTHAI,
      H.NGAYTAO,
      H.NGAYCAPNHAT
    FROM HOPDONG H
    LEFT JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
    LEFT JOIN NGUOIDUNG ND ON H.IDNGUOITAO = ND.IDNGUOIDUNG
    LEFT JOIN LOAIBAOHIEM L ON H.IDLOAI = L.IDLOAI
    WHERE ${condition}
    ORDER BY H.NGAYTAO DESC, H.IDHOPDONG DESC
  `);

  return result.recordset;
}

async function getExpiredContracts(userContext = {}) {
  const pool = await getPool();
  const { condition, request } = await buildContractScope(pool, userContext);

  const result = await request.query(`
    SELECT
      H.IDHOPDONG,
      H.SOHOPDONG,
      H.IDNGUOIDUOCBH,
      NDB.HOTEN AS TENKHACHHANG,
      H.IDNGUOITAO,
      ND.HOTEN AS TENNHANVIEN,
      H.IDLOAI,
      L.TENLOAI,
      H.NGAYBATDAU,
      H.NGAYKETTHUC,
      H.GIATRI,
      (
        SELECT TOP 1 K.SOTIENPHAIDONG
        FROM KYDONGPHI K
        WHERE K.IDHOPDONG = H.IDHOPDONG
        ORDER BY K.SOKY ASC, K.IDKY ASC
      ) AS SOTIENMOIKY,
      H.TRANGTHAI,
      H.NGAYTAO,
      H.NGAYCAPNHAT
    FROM HOPDONG H
    LEFT JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
    LEFT JOIN NGUOIDUNG ND ON H.IDNGUOITAO = ND.IDNGUOIDUNG
    LEFT JOIN LOAIBAOHIEM L ON H.IDLOAI = L.IDLOAI
    WHERE (
      H.NGAYKETTHUC < CAST(GETDATE() AS DATE)
      OR LOWER(ISNULL(H.TRANGTHAI, '')) LIKE N'%hết hạn%'
      OR LOWER(ISNULL(H.TRANGTHAI, '')) LIKE N'%expired%'
    )
    AND (${condition})
    ORDER BY H.NGAYKETTHUC DESC, H.IDHOPDONG DESC
  `);

  return result.recordset;
}

async function getInsuredAccounts() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      ND.IDNGUOIDUNG,
      ND.TENDANGNHAP,
      ND.HOTEN,
      ND.EMAIL,
      NDB.IDNGUOIDUOCBH,
      NDB.NGAYSINH,
      NDB.GIOITINH,
      NDB.COQUAN,
      NDB.DIACHILIENLAC
    FROM NGUOIDUNG ND
    INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
    LEFT JOIN NGUOIDUOCBAOHIEM NDB ON ND.IDNGUOIDUNG = NDB.IDNGUOIDUNG
    WHERE VR.MAVAITRO = 'INSURED'
    ORDER BY ND.HOTEN ASC, ND.IDNGUOIDUNG ASC
  `);

  return result.recordset;
}

async function createContract(payload) {
  const pool = await getPool();
  const contractCode = String(payload.idHopDong || `HD${Date.now()}`).slice(
    0,
    50,
  );
  const result = await pool
    .request()
    .input("SOHOPDONG", sql.VarChar(50), contractCode)
    .input("IDNGUOIDUOCBH", sql.BigInt, payload.idKhachHang)
    .input("IDLOAI", sql.BigInt, payload.idLoai)
    .input("IDNGUOITAO", sql.BigInt, payload.idNhanVien || null)
    .input("NGAYBATDAU", sql.Date, payload.ngayBatDau)
    .input("NGAYKETTHUC", sql.Date, payload.ngayKetThuc)
    .input("GIATRI", sql.Decimal(18, 2), payload.giaTri || 0)
    .input("TRANGTHAI", sql.NVarChar(20), payload.trangThai || "Còn thời hạn")
    .execute("sp_InsertHopDong");

  const periodAmount =
    payload.periodAmount ?? payload.soTienMoiKy ?? payload.soTienKy ?? null;
  if (periodAmount != null) {
    await createInstallmentSchedule({
      pool,
      contractId: result.recordset?.[0]?.IDHOPDONG,
      startDate: payload.ngayBatDau,
      endDate: payload.ngayKetThuc,
      contractValue: payload.giaTri,
      periodAmount,
    });
  }

  return {
    idHopDong: result.recordset?.[0]?.IDHOPDONG || null,
    soHopDong: contractCode,
  };
}

async function quickCreateContract(payload) {
  const pool = await getPool();
  console.log(
    "[DEBUG] quickCreateContract - Input payload:",
    JSON.stringify(payload, null, 2),
  );

  const contractCode = String(payload.soHopDong || `HD${Date.now()}`).slice(
    0,
    50,
  );

  // Validate creatorId exists first (foreign key requirement)
  const creatorResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, payload.creatorId).query(`
      SELECT TOP 1 IDNGUOIDUNG
      FROM NGUOIDUNG
      WHERE IDNGUOIDUNG = @IDNGUOIDUNG
    `);

  if (!creatorResult.recordset[0]) {
    throw new Error("Người tạo hợp đồng không tồn tại trong hệ thống");
  }
  console.log(
    "[DEBUG] quickCreateContract - creatorId validated:",
    payload.creatorId,
  );

  const insuredResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, payload.accountId).query(`
      SELECT TOP 1 IDNGUOIDUOCBH
      FROM NGUOIDUOCBAOHIEM
      WHERE IDNGUOIDUNG = @IDNGUOIDUNG
    `);

  const insuredId = insuredResult.recordset[0]?.IDNGUOIDUOCBH;
  if (!insuredId) {
    throw new Error("Không tìm thấy người được bảo hiểm tương ứng");
  }
  console.log("[DEBUG] quickCreateContract - insuredId found:", insuredId);

  const insuranceTypeResult = await pool
    .request()
    .input(
      "TENLOAI",
      sql.NVarChar(200),
      String(payload.insuranceType || "").trim(),
    ).query(`
      SELECT TOP 1 IDLOAI
      FROM LOAIBAOHIEM
      WHERE TENLOAI = @TENLOAI
    `);

  const insuranceTypeId = insuranceTypeResult.recordset[0]?.IDLOAI;
  if (!insuranceTypeId) {
    throw new Error("Không tìm thấy loại bảo hiểm tương ứng");
  }
  console.log(
    "[DEBUG] quickCreateContract - insuranceTypeId found:",
    insuranceTypeId,
  );

  try {
    const result = await pool
      .request()
      .input("SOHOPDONG", sql.VarChar(50), contractCode)
      .input("IDNGUOIDUOCBH", sql.BigInt, insuredId)
      .input("IDLOAI", sql.BigInt, insuranceTypeId)
      .input("IDNGUOITAO", sql.BigInt, payload.creatorId)
      .input("NGAYBATDAU", sql.Date, payload.startDate)
      .input("NGAYKETTHUC", sql.Date, payload.endDate)
      .input("GIATRI", sql.Decimal(18, 2), payload.contractValue || 0)
      .input("TRANGTHAI", sql.NVarChar(20), "Còn thời hạn")
      .execute("sp_InsertHopDong");

    console.log(
      "[DEBUG] quickCreateContract - SP result:",
      JSON.stringify(result.recordset, null, 2),
    );

    // Check if stored procedure returned an error message
    const spResult = result.recordset?.[0];
    if (spResult?.ErrorMessage) {
      throw new Error(`Lỗi tạo hợp đồng: ${spResult.ErrorMessage}`);
    }

    if (!spResult?.IDHOPDONG && spResult?.IDHOPDONG !== 0) {
      throw new Error("Không thể lấy ID hợp đồng từ database");
    }

    await createInstallmentSchedule({
      pool,
      contractId: spResult.IDHOPDONG,
      startDate: payload.startDate,
      endDate: payload.endDate,
      contractValue: payload.contractValue,
      periodAmount: payload.periodAmount,
    });

    return {
      idHopDong: spResult.IDHOPDONG,
      soHopDong: contractCode,
    };
  } catch (err) {
    // Re-throw with context
    if (err.message.includes("FOREIGN KEY")) {
      throw new Error(
        "Lỗi: Một trong các dữ liệu tham chiếu không tồn tại (người được bảo hiểm, loại bảo hiểm, hoặc người tạo)",
      );
    }
    throw err;
  }
}

module.exports = {
  getAllContracts,
  getExpiredContracts,
  getInsuredAccounts,
  createContract,
  quickCreateContract,
  createInstallmentSchedule,
  replaceInstallmentSchedule,
};
