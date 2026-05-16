const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../views/apiResponse.view");
const { getPool } = require("../config/db");
const { sql } = require("../config/db");
const {
  createInstallmentSchedule,
  replaceInstallmentSchedule,
} = require("../models/contract.model");

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function notFound(message) {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.statusCode = 409;
  return error;
}

async function resolveRoleId(pool, roleCode) {
  if (!roleCode) return null;
  const normalizedRole = String(roleCode || "")
    .trim()
    .toUpperCase();

  const roleResult = await pool
    .request()
    .input("MAVAITRO", sql.VarChar(30), normalizedRole)
    .query("SELECT TOP 1 IDVAITRO FROM VAITRO WHERE MAVAITRO = @MAVAITRO");

  if (!roleResult.recordset[0]) {
    throw badRequest("Invalid role code");
  }

  return roleResult.recordset[0].IDVAITRO;
}

async function writeAuditLog(pool, userId, tableName, dataId, action) {
  try {
    await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId || null)
      .input("TENBANG", sql.NVarChar(50), tableName)
      .input("IDDULIEU", sql.BigInt, Number(dataId))
      .input("HANHDONG", sql.NVarChar(20), action).query(`
        -- Use UTC time so clients can reliably convert to local time
        INSERT INTO NHATKY (IDNGUOIDUNG, TENBANG, IDDULIEU, HANHDONG, THOIGIAN)
        VALUES (@IDNGUOIDUNG, @TENBANG, @IDDULIEU, @HANHDONG, GETUTCDATE())
      `);
  } catch (err) {
    // Don't throw — logging failure shouldn't break the primary request.
    console.error(
      "writeAuditLog failed for table",
      tableName,
      "dataId",
      dataId,
      "action",
      action,
      "error:",
      err && err.message,
    );
  }
}

const getUsers = asyncHandler(async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      ND.IDNGUOIDUNG,
      ND.TENDANGNHAP,
      ND.HOTEN,
      ND.EMAIL,
      ND.TRANGTHAI,
      ND.NGAYTAO,
      VR.MAVAITRO,
      VR.TENVAITRO,
      CASE WHEN VR.MAVAITRO = 'INSURED' THEN 'customer' ELSE 'employee' END AS LOAI_TAI_KHOAN
    FROM NGUOIDUNG ND
    INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
    ORDER BY ND.NGAYTAO DESC, ND.IDNGUOIDUNG DESC
  `);

  return success(res, result.recordset, "Users fetched");
});

const getInsuranceTypes = asyncHandler(async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      LB.IDLOAI,
      LB.TENLOAI,
      LB.MOTA,
      COUNT(H.IDHOPDONG) AS SOLUONG_HOPDONG
    FROM LOAIBAOHIEM LB
    LEFT JOIN HOPDONG H ON H.IDLOAI = LB.IDLOAI
    GROUP BY LB.IDLOAI, LB.TENLOAI, LB.MOTA
    ORDER BY LB.IDLOAI
  `);

  return success(res, result.recordset, "Insurance types fetched");
});

const getAssignments = asyncHandler(async (req, res) => {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      P.IDPHANCONG,
      P.IDNGUOIDUNG,
      ND.HOTEN AS TENNGUOIDUNG,
      ND.TENDANGNHAP,
      VR.MAVAITRO,
      P.IDLOAI,
      LB.TENLOAI,
      P.LOAIPHANCONG,
      P.NGAYBATDAU,
      P.NGAYKETTHUC
    FROM PHANCONG P
    INNER JOIN NGUOIDUNG ND ON P.IDNGUOIDUNG = ND.IDNGUOIDUNG
    INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
    INNER JOIN LOAIBAOHIEM LB ON P.IDLOAI = LB.IDLOAI
    ORDER BY P.IDPHANCONG DESC
  `);

  return success(res, result.recordset, "Assignments fetched");
});

const createAssignment = asyncHandler(async (req, res) => {
  const { idNguoiDung, idLoai, loaiPhanCong, ngayBatDau, ngayKetThuc } =
    req.body;

  if (!idNguoiDung || !idLoai || !loaiPhanCong) {
    throw badRequest("idNguoiDung, idLoai and loaiPhanCong are required");
  }

  const normalizedAssignment = String(loaiPhanCong || "")
    .trim()
    .toUpperCase();

  if (!["ACCOUNTANT", "SUPERVISOR"].includes(normalizedAssignment)) {
    throw badRequest("loaiPhanCong must be ACCOUNTANT or SUPERVISOR");
  }

  const pool = await getPool();

  const userRoleResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, Number(idNguoiDung)).query(`
      SELECT VR.MAVAITRO
      FROM NGUOIDUNG ND
      INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
      WHERE ND.IDNGUOIDUNG = @IDNGUOIDUNG
    `);

  const userRole = userRoleResult.recordset[0]?.MAVAITRO;
  if (!userRole) {
    throw notFound("User not found");
  }

  if (userRole !== normalizedAssignment) {
    throw badRequest("Assignment type must match user's role");
  }

  const duplicateResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, Number(idNguoiDung))
    .input("IDLOAI", sql.BigInt, Number(idLoai))
    .input("LOAIPHANCONG", sql.VarChar(20), normalizedAssignment).query(`
      SELECT TOP 1 IDPHANCONG
      FROM PHANCONG
      WHERE IDNGUOIDUNG = @IDNGUOIDUNG
        AND IDLOAI = @IDLOAI
        AND UPPER(LOAIPHANCONG) = @LOAIPHANCONG
    `);

  if (duplicateResult.recordset[0]) {
    throw conflict("Assignment already exists");
  }

  const insertResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, Number(idNguoiDung))
    .input("IDLOAI", sql.BigInt, Number(idLoai))
    .input("LOAIPHANCONG", sql.VarChar(20), normalizedAssignment)
    .input("NGAYBATDAU", sql.Date, ngayBatDau || null)
    .input("NGAYKETTHUC", sql.Date, ngayKetThuc || null).query(`
      INSERT INTO PHANCONG (IDNGUOIDUNG, IDLOAI, LOAIPHANCONG, NGAYBATDAU, NGAYKETTHUC)
      VALUES (@IDNGUOIDUNG, @IDLOAI, @LOAIPHANCONG, @NGAYBATDAU, @NGAYKETTHUC);

      SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS IDPHANCONG;
    `);

  await writeAuditLog(
    pool,
    req.user?.id,
    "PHANCONG",
    insertResult.recordset[0].IDPHANCONG,
    "THEM",
  );

  return success(
    res,
    { idPhanCong: insertResult.recordset[0].IDPHANCONG },
    "Assignment created",
    201,
  );
});

const updateAssignment = asyncHandler(async (req, res) => {
  const assignmentId = Number(req.params.id);
  const { idLoai, ngayBatDau, ngayKetThuc } = req.body;

  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    throw badRequest("Invalid assignment id");
  }

  const pool = await getPool();
  const updateResult = await pool
    .request()
    .input("IDPHANCONG", sql.BigInt, assignmentId)
    .input("IDLOAI", sql.BigInt, idLoai == null ? null : Number(idLoai))
    .input("NGAYBATDAU", sql.Date, ngayBatDau || null)
    .input("NGAYKETTHUC", sql.Date, ngayKetThuc || null).query(`
      UPDATE PHANCONG
      SET
        IDLOAI = COALESCE(@IDLOAI, IDLOAI),
        NGAYBATDAU = COALESCE(@NGAYBATDAU, NGAYBATDAU),
        NGAYKETTHUC = COALESCE(@NGAYKETTHUC, NGAYKETTHUC)
      WHERE IDPHANCONG = @IDPHANCONG;

      SELECT @@ROWCOUNT AS AFFECTED;
    `);

  if (!updateResult.recordset[0].AFFECTED) {
    throw notFound("Assignment not found");
  }

  await writeAuditLog(pool, req.user?.id, "PHANCONG", assignmentId, "SUA");

  return success(res, null, "Assignment updated");
});

const deleteAssignment = asyncHandler(async (req, res) => {
  const assignmentId = Number(req.params.id);

  if (!Number.isInteger(assignmentId) || assignmentId <= 0) {
    throw badRequest("Invalid assignment id");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDPHANCONG", sql.BigInt, assignmentId)
    .query(
      "DELETE FROM PHANCONG WHERE IDPHANCONG = @IDPHANCONG; SELECT @@ROWCOUNT AS AFFECTED;",
    );

  if (!result.recordset[0].AFFECTED) {
    throw notFound("Assignment not found");
  }

  await writeAuditLog(pool, req.user?.id, "PHANCONG", assignmentId, "HUY");

  return success(res, null, "Assignment deleted");
});

const createUser = asyncHandler(async (req, res) => {
  const { username, password, fullName, email, role, status } = req.body;

  if (!username || !password || !role) {
    throw badRequest("username, password and role are required");
  }

  const pool = await getPool();
  const roleId = await resolveRoleId(pool, role);

  // Check for existing username to return a friendly 409 instead of DB error
  const existingUser = await pool
    .request()
    .input("TENDANGNHAP", sql.VarChar(100), String(username).trim())
    .query(
      `SELECT TOP 1 IDNGUOIDUNG FROM NGUOIDUNG WHERE UPPER(TENDANGNHAP) = UPPER(@TENDANGNHAP)`,
    );

  if (existingUser.recordset[0]) {
    throw conflict("Username already exists");
  }

  let insertResult;
  try {
    insertResult = await pool
      .request()
      .input("TENDANGNHAP", sql.VarChar(100), String(username).trim())
      .input("MATKHAU", sql.NVarChar(255), String(password))
      .input("HOTEN", sql.NVarChar(100), fullName || null)
      .input("EMAIL", sql.VarChar(100), email || null)
      .input("IDVAITRO", sql.BigInt, roleId)
      .input("TRANGTHAI", sql.NVarChar(30), status || "Đang hoạt động").query(`
        DECLARE @SALT VARBINARY(16) = CRYPT_GEN_RANDOM(16);
        DECLARE @HASHEDPW VARBINARY(64);

        -- Hash the provided password together with the salt and keep as VARBINARY
        SELECT @HASHEDPW = HASHBYTES('SHA2_256', CONVERT(VARCHAR(MAX), @MATKHAU) + CONVERT(VARCHAR(MAX), @SALT));

        INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
        VALUES (@TENDANGNHAP, @HASHEDPW, @HOTEN, @EMAIL, @IDVAITRO, @TRANGTHAI, @SALT, GETDATE());

        SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS IDNGUOIDUNG;
      `);
  } catch (err) {
    // SQL Server duplicate key errors: 2627 or 2601
    if (err && (err.number === 2627 || err.number === 2601)) {
      throw conflict("Username already exists");
    }
    throw err;
  }

  await writeAuditLog(
    pool,
    req.user?.id,
    "NGUOIDUNG",
    insertResult.recordset[0].IDNGUOIDUNG,
    "THEM",
  );

  return success(
    res,
    {
      idNguoiDung: insertResult.recordset[0].IDNGUOIDUNG,
      username: String(username).trim(),
    },
    "User created",
    201,
  );
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw badRequest("Invalid user id");
  }

  const { fullName, email, role, status } = req.body;

  const pool = await getPool();
  const roleId = await resolveRoleId(pool, role);

  const updateResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, userId)
    .input("HOTEN", sql.NVarChar(100), fullName || null)
    .input("EMAIL", sql.VarChar(100), email || null)
    .input("IDVAITRO", sql.BigInt, roleId)
    .input("TRANGTHAI", sql.NVarChar(30), status || null).query(`
      UPDATE NGUOIDUNG
      SET
        HOTEN = COALESCE(@HOTEN, HOTEN),
        EMAIL = COALESCE(@EMAIL, EMAIL),
        IDVAITRO = COALESCE(@IDVAITRO, IDVAITRO),
        TRANGTHAI = COALESCE(@TRANGTHAI, TRANGTHAI)
      WHERE IDNGUOIDUNG = @IDNGUOIDUNG;

      SELECT @@ROWCOUNT AS AFFECTED;
    `);

  if (!updateResult.recordset[0].AFFECTED) {
    throw notFound("User not found");
  }

  await writeAuditLog(pool, req.user?.id, "NGUOIDUNG", userId, "SUA");

  return success(res, null, "User updated");
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = Number(req.params.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    throw badRequest("Invalid user id");
  }

  const pool = await getPool();

  try {
    console.log(
      "deleteUser: attempting delete IDNGUOIDUNG=",
      userId,
      "by",
      req.user?.id,
    );
    const deleteResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId)
      .query(
        "DELETE FROM NGUOIDUNG WHERE IDNGUOIDUNG = @IDNGUOIDUNG; SELECT @@ROWCOUNT AS AFFECTED;",
      );

    if (!deleteResult.recordset[0].AFFECTED) {
      throw notFound("User not found");
    }
    console.log(
      "deleteUser: delete affected=",
      deleteResult.recordset[0].AFFECTED,
      "attempting audit write",
    );
    await writeAuditLog(pool, req.user?.id, "NGUOIDUNG", userId, "HUY");
    console.log("deleteUser: audit write attempted for NGUOIDUNG", userId);

    return success(res, null, "User deleted");
  } catch (error) {
    if (error.statusCode) {
      // Log the failed delete attempt before rethrowing
      try {
        console.log(
          "deleteUser: write HUY_THAT_BAI for",
          userId,
          "because of statusCode error",
          error.statusCode,
        );
        await writeAuditLog(
          pool,
          req.user?.id,
          "NGUOIDUNG",
          userId,
          "HUY_THAT_BAI",
        );
        console.log(
          "deleteUser: attempted HUY_THAT_BAI audit write for",
          userId,
        );
      } catch (logErr) {
        console.error("Audit log failed:", logErr && logErr.message);
      }

      throw error;
    }

    const deactivateResult = await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, userId).query(`
        UPDATE NGUOIDUNG
        SET TRANGTHAI = N'Ngưng hoạt động'
        WHERE IDNGUOIDUNG = @IDNGUOIDUNG;

        SELECT @@ROWCOUNT AS AFFECTED;
      `);

    if (!deactivateResult.recordset[0].AFFECTED) {
      throw notFound("User not found");
    }

    await writeAuditLog(pool, req.user?.id, "NGUOIDUNG", userId, "SUA");

    return success(
      res,
      null,
      "User has linked records, status was changed to Ngưng hoạt động",
    );
  }
});

const createInsuranceType = asyncHandler(async (req, res) => {
  const { tenLoai, moTa } = req.body;

  if (!tenLoai) {
    throw badRequest("tenLoai is required");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("TENLOAI", sql.NVarChar(200), tenLoai)
    .input("MOTA", sql.NVarChar(500), moTa || null).query(`
      INSERT INTO LOAIBAOHIEM (TENLOAI, MOTA)
      VALUES (@TENLOAI, @MOTA);

      SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS IDLOAI;
    `);

  // Trace creation and audit write for debugging missing logs
  console.log(
    "createInsuranceType: created IDLOAI=",
    result.recordset[0].IDLOAI,
    "by user",
    req.user?.id,
  );
  await writeAuditLog(
    pool,
    req.user?.id,
    "LOAIBAOHIEM",
    result.recordset[0].IDLOAI,
    "THEM",
  );

  console.log(
    "createInsuranceType: audit write attempted for IDLOAI=",
    result.recordset[0].IDLOAI,
  );

  return success(
    res,
    { idLoai: result.recordset[0].IDLOAI },
    "Insurance type created",
    201,
  );
});

const updateInsuranceType = asyncHandler(async (req, res) => {
  const insuranceTypeId = Number(req.params.id);
  const { tenLoai, moTa } = req.body;

  if (!Number.isInteger(insuranceTypeId) || insuranceTypeId <= 0) {
    throw badRequest("Invalid insurance type id");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDLOAI", sql.BigInt, insuranceTypeId)
    .input("TENLOAI", sql.NVarChar(200), tenLoai || null)
    .input("MOTA", sql.NVarChar(500), moTa || null).query(`
      UPDATE LOAIBAOHIEM
      SET
        TENLOAI = COALESCE(@TENLOAI, TENLOAI),
        MOTA = COALESCE(@MOTA, MOTA)
      WHERE IDLOAI = @IDLOAI;

      SELECT @@ROWCOUNT AS AFFECTED;
    `);

  if (!result.recordset[0].AFFECTED) {
    throw notFound("Insurance type not found");
  }

  await writeAuditLog(
    pool,
    req.user?.id,
    "LOAIBAOHIEM",
    insuranceTypeId,
    "SUA",
  );

  return success(res, null, "Insurance type updated");
});

const deleteInsuranceType = asyncHandler(async (req, res) => {
  const insuranceTypeId = Number(req.params.id);

  if (!Number.isInteger(insuranceTypeId) || insuranceTypeId <= 0) {
    throw badRequest("Invalid insurance type id");
  }

  const pool = await getPool();
  const referenceResult = await pool
    .request()
    .input("IDLOAI", sql.BigInt, insuranceTypeId).query(`
      SELECT
        (SELECT COUNT(*) FROM HOPDONG WHERE IDLOAI = @IDLOAI) AS HOPDONG_COUNT,
        (SELECT COUNT(*) FROM PHANCONG WHERE IDLOAI = @IDLOAI) AS PHANCONG_COUNT;
    `);

  const { HOPDONG_COUNT, PHANCONG_COUNT } = referenceResult.recordset[0];

  if (Number(HOPDONG_COUNT) > 0 || Number(PHANCONG_COUNT) > 0) {
    throw conflict("Insurance type is in use and cannot be deleted");
  }

  const deleteResult = await pool
    .request()
    .input("IDLOAI", sql.BigInt, insuranceTypeId)
    .query(
      "DELETE FROM LOAIBAOHIEM WHERE IDLOAI = @IDLOAI; SELECT @@ROWCOUNT AS AFFECTED;",
    );

  if (!deleteResult.recordset[0].AFFECTED) {
    throw notFound("Insurance type not found");
  }

  await writeAuditLog(
    pool,
    req.user?.id,
    "LOAIBAOHIEM",
    insuranceTypeId,
    "HUY",
  );

  return success(res, null, "Insurance type deleted");
});

const createContract = asyncHandler(async (req, res) => {
  const {
    soHopDong,
    idNguoiduocBH,
    idLoai,
    idNguoiTao,
    ngayBatDau,
    ngayKetThuc,
    giaTri,
    periodAmount,
    trangThai,
  } = req.body;

  if (
    !soHopDong ||
    !idNguoiduocBH ||
    !idLoai ||
    !idNguoiTao ||
    !ngayBatDau ||
    !ngayKetThuc
  ) {
    throw badRequest(
      "soHopDong, idNguoiduocBH, idLoai, idNguoiTao, ngayBatDau, ngayKetThuc are required",
    );
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("SOHOPDONG", sql.VarChar(50), soHopDong)
    .input("IDNGUOIDUOCBH", sql.BigInt, Number(idNguoiduocBH))
    .input("IDLOAI", sql.BigInt, Number(idLoai))
    .input("IDNGUOITAO", sql.BigInt, Number(idNguoiTao))
    .input("NGAYBATDAU", sql.Date, ngayBatDau)
    .input("NGAYKETTHUC", sql.Date, ngayKetThuc)
    .input("GIATRI", sql.Decimal(18, 2), Number(giaTri || 0))
    .input("TRANGTHAI", sql.NVarChar(20), trangThai || "Còn thời hạn").query(`
      INSERT INTO HOPDONG
        (SOHOPDONG, IDNGUOIDUOCBH, IDLOAI, IDNGUOITAO, NGAYBATDAU, NGAYKETTHUC, GIATRI, TRANGTHAI, NGAYTAO, NGAYCAPNHAT)
      VALUES
        (@SOHOPDONG, @IDNGUOIDUOCBH, @IDLOAI, @IDNGUOITAO, @NGAYBATDAU, @NGAYKETTHUC, @GIATRI, @TRANGTHAI, GETDATE(), GETDATE());

      SELECT CAST(SCOPE_IDENTITY() AS BIGINT) AS IDHOPDONG;
    `);

  if (periodAmount != null) {
    await createInstallmentSchedule({
      pool,
      contractId: result.recordset[0].IDHOPDONG,
      startDate: ngayBatDau,
      endDate: ngayKetThuc,
      contractValue: giaTri,
      periodAmount,
    });
  }

  await writeAuditLog(
    pool,
    req.user?.id,
    "HOPDONG",
    result.recordset[0].IDHOPDONG,
    "THEM",
  );

  return success(
    res,
    { idHopDong: result.recordset[0].IDHOPDONG },
    "Contract created",
    201,
  );
});

const updateContract = asyncHandler(async (req, res) => {
  const contractId = Number(req.params.id);
  const {
    ngayBatDau,
    ngayKetThuc,
    giaTri,
    periodAmount,
    trangThai,
    idLoai,
    idNguoiTao,
    idNguoiduocBH,
  } = req.body;

  if (!Number.isInteger(contractId) || contractId <= 0) {
    throw badRequest("Invalid contract id");
  }

  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDHOPDONG", sql.BigInt, contractId)
    .input("NGAYBATDAU", sql.Date, ngayBatDau || null)
    .input("NGAYKETTHUC", sql.Date, ngayKetThuc || null)
    .input("GIATRI", sql.Decimal(18, 2), giaTri == null ? null : Number(giaTri))
    .input("TRANGTHAI", sql.NVarChar(20), trangThai || null)
    .input("IDLOAI", sql.BigInt, idLoai == null ? null : Number(idLoai))
    .input(
      "IDNGUOITAO",
      sql.BigInt,
      idNguoiTao == null ? null : Number(idNguoiTao),
    )
    .input(
      "IDNGUOIDUOCBH",
      sql.BigInt,
      idNguoiduocBH == null ? null : Number(idNguoiduocBH),
    ).query(`
      UPDATE HOPDONG
      SET
        NGAYBATDAU = COALESCE(@NGAYBATDAU, NGAYBATDAU),
        NGAYKETTHUC = COALESCE(@NGAYKETTHUC, NGAYKETTHUC),
        GIATRI = COALESCE(@GIATRI, GIATRI),
        TRANGTHAI = COALESCE(@TRANGTHAI, TRANGTHAI),
        IDLOAI = COALESCE(@IDLOAI, IDLOAI),
        IDNGUOITAO = COALESCE(@IDNGUOITAO, IDNGUOITAO),
        IDNGUOIDUOCBH = COALESCE(@IDNGUOIDUOCBH, IDNGUOIDUOCBH),
        NGAYCAPNHAT = GETDATE()
      WHERE IDHOPDONG = @IDHOPDONG;

      SELECT @@ROWCOUNT AS AFFECTED;
    `);

  if (!result.recordset[0].AFFECTED) {
    throw notFound("Contract not found");
  }

  if (periodAmount != null) {
    await replaceInstallmentSchedule({
      pool,
      contractId,
      startDate: ngayBatDau,
      endDate: ngayKetThuc,
      contractValue: giaTri,
      periodAmount,
    });
  }

  await writeAuditLog(pool, req.user?.id, "HOPDONG", contractId, "SUA");

  return success(res, null, "Contract updated");
});

const deleteContract = asyncHandler(async (req, res) => {
  const contractId = Number(req.params.id);

  if (!Number.isInteger(contractId) || contractId <= 0) {
    throw badRequest("Invalid contract id");
  }

  const pool = await getPool();

  try {
    const deleteResult = await pool
      .request()
      .input("IDHOPDONG", sql.BigInt, contractId)
      .query(
        "DELETE FROM HOPDONG WHERE IDHOPDONG = @IDHOPDONG; SELECT @@ROWCOUNT AS AFFECTED;",
      );

    if (!deleteResult.recordset[0].AFFECTED) {
      throw notFound("Contract not found");
    }

    await writeAuditLog(pool, req.user?.id, "HOPDONG", contractId, "HUY");

    return success(res, null, "Contract deleted");
  } catch (error) {
    const fallbackResult = await pool
      .request()
      .input("IDHOPDONG", sql.BigInt, contractId).query(`
        UPDATE HOPDONG
        SET TRANGTHAI = N'Đã hủy', NGAYCAPNHAT = GETDATE()
        WHERE IDHOPDONG = @IDHOPDONG;

        SELECT @@ROWCOUNT AS AFFECTED;
      `);

    if (!fallbackResult.recordset[0].AFFECTED) {
      throw notFound("Contract not found");
    }

    await writeAuditLog(pool, req.user?.id, "HOPDONG", contractId, "SUA");

    return success(
      res,
      null,
      "Contract has linked records, status was changed to Đã hủy",
    );
  }
});

const getActivityFeed = asyncHandler(async (req, res) => {
  console.log("[getActivityFeed] Fetching activity from NHATKY table...");
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT TOP (50)
      LOWER(NK.TENBANG) AS ENTITY_TYPE,
      CASE UPPER(NK.HANHDONG)
        WHEN 'THEM' THEN N'created'
        WHEN 'SUA' THEN N'updated'
        WHEN 'HUY' THEN N'deleted'
        WHEN 'XACNHANTHANHTOAN' THEN N'confirmed'
        WHEN 'HUYXACNHANTHANHTOAN' THEN N'canceled'
        ELSE LOWER(NK.HANHDONG)
      END AS EVENT_KIND,
      -- Localized action label (verb + entity) to avoid client-side mis-mapping
      CONCAT(
        CASE UPPER(NK.HANHDONG)
          WHEN 'THEM' THEN N'Tạo'
          WHEN 'SUA' THEN N'Cập nhật'
          WHEN 'HUY' THEN N'Xóa'
          WHEN 'XACNHANTHANHTOAN' THEN N'Xác nhận'
          WHEN 'HUYXACNHANTHANHTOAN' THEN N'Hủy xác nhận'
          ELSE NK.HANHDONG
        END,
        N' ',
        CASE UPPER(NK.TENBANG)
          WHEN 'HOPDONG' THEN N'hợp đồng'
          WHEN 'THANHTOAN' THEN N'thanh toán'
          WHEN 'NGUOIDUNG' THEN N'người dùng'
          WHEN 'LOAIBAOHIEM' THEN N'loại bảo hiểm'
          WHEN 'PHANCONG' THEN N'phân công'
          ELSE NK.TENBANG
        END
      ) AS ACTION_LABEL,
      NK.IDDULIEU AS ENTITY_ID,
      CASE UPPER(NK.TENBANG)
        WHEN 'HOPDONG' THEN ISNULL(H.SOHOPDONG, CONCAT('Contract #', NK.IDDULIEU))
        WHEN 'THANHTOAN' THEN CONCAT('Payment #', NK.IDDULIEU)
        WHEN 'NGUOIDUNG' THEN ISNULL(NU.TENDANGNHAP, CONCAT('User #', NK.IDDULIEU))
        WHEN 'LOAIBAOHIEM' THEN ISNULL(LBI.TENLOAI, CONCAT('Insurance type #', NK.IDDULIEU))
        WHEN 'PHANCONG' THEN CONCAT('Assignment #', NK.IDDULIEU)
        ELSE CONCAT(NK.TENBANG, ' #', NK.IDDULIEU)
      END AS ENTITY_NAME,
      ISNULL(ACTOR.HOTEN, N'Hệ thống') AS ACTOR_NAME,
      ISNULL(ACTOR.TENDANGNHAP, N'system') AS ACTOR_LOGIN,
      CASE UPPER(NK.TENBANG)
        WHEN 'HOPDONG' THEN NDB.HOTEN
        WHEN 'PHANCONG' THEN ASSIGNEE.HOTEN
        WHEN 'NGUOIDUNG' THEN NU.HOTEN
        ELSE NULL
      END AS TARGET_NAME,
      CASE UPPER(NK.TENBANG)
        WHEN 'HOPDONG' THEN LBH.TENLOAI
        WHEN 'THANHTOAN' THEN CONCAT(N'Kỳ ', K.SOKY, N' - HĐ ', H2.SOHOPDONG)
        WHEN 'NGUOIDUNG' THEN VU.TENVAITRO
        WHEN 'LOAIBAOHIEM' THEN LBI.MOTA
        WHEN 'PHANCONG' THEN CONCAT(ISNULL(LBP.TENLOAI, CONCAT('Type #', NK.IDDULIEU)), N' / ', ISNULL(P.LOAIPHANCONG, N''))
        ELSE NULL
      END AS DETAIL,
      -- Return ISO8601 UTC timestamp so frontend can convert to user's local time
      -- both UTC and local (SE Asia) timestamps
      CONVERT(varchar(33), NK.THOIGIAN AT TIME ZONE 'UTC', 127) AS EVENT_AT_UTC,
      CONVERT(varchar(33), (NK.THOIGIAN AT TIME ZONE 'UTC') AT TIME ZONE 'SE Asia Standard Time', 127) AS EVENT_AT_LOCAL,
      CASE UPPER(NK.TENBANG)
        WHEN 'HOPDONG' THEN H.TRANGTHAI
        WHEN 'THANHTOAN' THEN T.TRANGTHAI
        WHEN 'NGUOIDUNG' THEN NU.TRANGTHAI
        ELSE NULL
      END AS STATUS
    FROM NHATKY NK
    LEFT JOIN NGUOIDUNG ACTOR ON ACTOR.IDNGUOIDUNG = NK.IDNGUOIDUNG

    LEFT JOIN HOPDONG H ON UPPER(NK.TENBANG) = 'HOPDONG' AND H.IDHOPDONG = NK.IDDULIEU
    LEFT JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
    LEFT JOIN LOAIBAOHIEM LBH ON H.IDLOAI = LBH.IDLOAI

    LEFT JOIN THANHTOAN T ON UPPER(NK.TENBANG) = 'THANHTOAN' AND T.IDTHANHTOAN = NK.IDDULIEU
    LEFT JOIN KYDONGPHI K ON T.IDKY = K.IDKY
    LEFT JOIN HOPDONG H2 ON K.IDHOPDONG = H2.IDHOPDONG

    LEFT JOIN NGUOIDUNG NU ON UPPER(NK.TENBANG) = 'NGUOIDUNG' AND NU.IDNGUOIDUNG = NK.IDDULIEU
    LEFT JOIN VAITRO VU ON NU.IDVAITRO = VU.IDVAITRO

    LEFT JOIN LOAIBAOHIEM LBI ON UPPER(NK.TENBANG) = 'LOAIBAOHIEM' AND LBI.IDLOAI = NK.IDDULIEU

    LEFT JOIN PHANCONG P ON UPPER(NK.TENBANG) = 'PHANCONG' AND P.IDPHANCONG = NK.IDDULIEU
    LEFT JOIN NGUOIDUNG ASSIGNEE ON P.IDNGUOIDUNG = ASSIGNEE.IDNGUOIDUNG
    LEFT JOIN LOAIBAOHIEM LBP ON P.IDLOAI = LBP.IDLOAI

    ORDER BY NK.THOIGIAN DESC, NK.IDNHATKY DESC
  `);

  console.log(`[getActivityFeed] ✓ Returned ${result.recordset.length} activity records`);
  return success(res, result.recordset, "Activity feed fetched");
});

module.exports = {
  getUsers,
  getInsuranceTypes,
  getAssignments,
  getActivityFeed,
  createUser,
  updateUser,
  deleteUser,
  createInsuranceType,
  updateInsuranceType,
  deleteInsuranceType,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createContract,
  updateContract,
  deleteContract,
};
