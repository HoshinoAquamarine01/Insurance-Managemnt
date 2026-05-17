const { getPool, sql } = require("../config/db");

async function getAllCustomers() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT ND.IDNGUOIDUNG, ND.TENDANGNHAP, ND.HOTEN, ND.EMAIL, ND.TRANGTHAI,
           NDB.IDNGUOIDUOCBH, NDB.NGAYSINH, NDB.GIOITINH, NDB.COQUAN, NDB.DIACHILIENLAC,
           VR.MAVAITRO, VR.TENVAITRO
    FROM NGUOIDUNG ND
    INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
    LEFT JOIN NGUOIDUOCBAOHIEM NDB ON ND.IDNGUOIDUNG = NDB.IDNGUOIDUNG
    WHERE VR.MAVAITRO = 'INSURED'
  `);

  return result.recordset;
}

async function createCustomer(payload) {
  const pool = await getPool();

  // Get IDVAITRO for INSURED role
  const roleResult = await pool
    .request()
    .input("MAVAITRO", sql.VarChar(30), "INSURED")
    .query(`SELECT IDVAITRO FROM VAITRO WHERE MAVAITRO = @MAVAITRO`);

  if (!roleResult.recordset[0]) {
    throw new Error("INSURED role not found");
  }

  const idVaiTro = roleResult.recordset[0].IDVAITRO;

  // Register user using stored procedure
  const userResult = await pool
    .request()
    .input("TENDANGNHAP", sql.VarChar(100), payload.tenDangNhap)
    .input("MATKHAU", sql.NVarChar(255), payload.matKhau)
    .input("HOTEN", sql.NVarChar(100), payload.hoTen)
    .input("EMAIL", sql.VarChar(100), payload.email || payload.tenDangNhap)
    .input("IDVAITRO", sql.BigInt, idVaiTro)
    .input("TRANGTHAI", sql.NVarChar(30), "Đang hoạt động")
    .execute("sp_RegisterUser");

  if (
    !userResult.recordset[0] ||
    userResult.recordset[0].Result !== "SUCCESS"
  ) {
    throw new Error("Failed to create user");
  }

  const idNguoidung = userResult.recordset[0].IDNGUOIDUNG;

  // Create insured person record
  if (payload.cccd || payload.ngaySinh) {
    await pool
      .request()
      .input("IDNGUOIDUNG", sql.BigInt, idNguoidung)
      .input("HOTEN", sql.NVarChar(100), payload.hoTen)
      .input("NGAYSINH", sql.Date, payload.ngaySinh)
      .input("GIOITINH", sql.NVarChar(10), payload.gioiTinh)
      .input("COQUAN", sql.NVarChar(200), payload.coQuan)
      .input("DIACHILIENLAC", sql.NVarChar(200), payload.diaChiLienLac).query(`
        INSERT INTO NGUOIDUOCBAOHIEM (IDNGUOIDUNG, HOTEN, NGAYSINH, GIOITINH, COQUAN, DIACHILIENLAC)
        VALUES (@IDNGUOIDUNG, @HOTEN, @NGAYSINH, @GIOITINH, @COQUAN, @DIACHILIENLAC)
      `);
  }

  return idNguoidung;
}

async function loginCustomer(tenDangNhap, matKhau) {
  const pool = await getPool();

  try {
    const result = await pool
      .request()
      .input("TENDANGNHAP", sql.VarChar(100), tenDangNhap)
      .input("MATKHAU", sql.VarChar(255), matKhau)
      .execute("sp_ValidateLogin");

    const user = result.recordset[0];
    if (user && user.MAVAITRO === "INSURED") {
      return user;
    }
  } catch (procError) {
    console.log("[LOGIN DEBUG] sp_ValidateLogin failed:", procError.message);
  }

  // Fallback: direct query with correct password encoding
  try {
    const fallbackResult = await pool
      .request()
      .input("TENDANGNHAP", sql.VarChar(100), tenDangNhap)
      .input("MATKHAU", sql.VarChar(255), matKhau).query(`
        SELECT TOP 1
          ND.IDNGUOIDUNG,
          ND.TENDANGNHAP,
          ND.HOTEN,
          ND.EMAIL,
          ND.IDVAITRO,
          ND.TRANGTHAI,
          VR.MAVAITRO,
          VR.TENVAITRO
        FROM NGUOIDUNG ND
        INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
        WHERE ND.TENDANGNHAP = @TENDANGNHAP
            AND ND.MATKHAU = HASHBYTES('SHA2_256', CONVERT(VARCHAR(MAX), @MATKHAU) + CONVERT(VARCHAR(MAX), ND.SALT))
            AND VR.MAVAITRO = 'INSURED'
      `);

    const user = fallbackResult.recordset[0];
    console.log(
      "[LOGIN DEBUG] Fallback query returned:",
      user ? "USER FOUND" : "NO USER",
    );
    if (!user) return null;

    // Only return if user is INSURED (customer)
    if (user.MAVAITRO !== "INSURED") {
      console.log("[LOGIN DEBUG] User role is not INSURED:", user.MAVAITRO);
      return null;
    }

    return user;
  } catch (fallbackError) {
    console.log("[LOGIN DEBUG] Fallback query failed:", fallbackError.message);
    throw fallbackError;
  }
}

async function getContractsByCustomer(idNguoidung) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, idNguoidung).query(`
      SELECT H.IDHOPDONG, H.SOHOPDONG, NDB.IDNGUOIDUOCBH, NDB.HOTEN AS TENKHACHHANG,
             ND.IDNGUOIDUNG, ND.HOTEN AS TENNHANVIEN,
             H.IDLOAI, LB.TENLOAI, H.NGAYBATDAU, H.NGAYKETTHUC, H.GIATRI, H.TRANGTHAI
      FROM HOPDONG H
      JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
      JOIN NGUOIDUNG ND ON H.IDNGUOITAO = ND.IDNGUOIDUNG
      JOIN LOAIBAOHIEM LB ON H.IDLOAI = LB.IDLOAI
      WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG
      ORDER BY H.NGAYBATDAU DESC
    `);

  return result.recordset;
}

async function getPaymentsByCustomer(idNguoidung) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, idNguoidung).query(`
      SELECT K.IDKY, K.IDHOPDONG, K.SOKY, K.NGAYDENHAN, K.SOTIENPHAIDONG, K.TRANGTHAI,
             T.IDTHANHTOAN, T.NGAYTHANHTOAN, T.SOTIEN, T.PHUONGTHUC, T.MACHUNGTU, T.TRANGTHAI AS TRANGTHAI_THANHTOAN
      FROM KYDONGPHI K
      LEFT JOIN THANHTOAN T ON K.IDKY = T.IDKY
      WHERE K.IDHOPDONG IN (
        SELECT H.IDHOPDONG FROM HOPDONG H
        JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
        WHERE NDB.IDNGUOIDUNG = @IDNGUOIDUNG
      )
      ORDER BY K.NGAYDENHAN ASC
    `);

  return result.recordset;
}

module.exports = {
  getAllCustomers,
  createCustomer,
  loginCustomer,
  getContractsByCustomer,
  getPaymentsByCustomer,
};

async function getMedicalHistoryByInsuredId(idNguoiDuocBh) {
  const pool = await getPool();

  // Run OPEN SYMMETRIC KEY and stored proc in same batch to ensure same session
  try {
    const result = await pool
      .request()
      .input("IDNGUOIDUOCBH", sql.BigInt, idNguoiDuocBh).query(`
        OPEN SYMMETRIC KEY SymKeyQlbhAES DECRYPTION BY CERTIFICATE CertQlbhEncryption;
        EXEC sp_GetNguoiduocBaoHiemEncrypted @IDNGUOIDUOCBH;
        CLOSE SYMMETRIC KEY SymKeyQlbhAES;
      `);

    const row = result.recordset?.[0] || null;

    // If DB didn't return decrypted LICHSUBENH but returned raw varbinary, try UTF-8 fallback
    if (row && !row.LICHSUBENH_Decrypted && row.LICHSUBENH) {
      try {
        const raw = row.LICHSUBENH;
        if (raw && Buffer.isBuffer(raw)) {
          const attempt = raw.toString("utf8");
          if (attempt && attempt.trim()) {
            row.LICHSUBENH_Decrypted = attempt;
            console.log(
              "[DB_FALLBACK] Decoded LICHSUBENH via UTF-8 fallback for insured id",
              idNguoiDuocBh,
            );
          }
        }
      } catch (decodeErr) {
        console.log("[DB_FALLBACK] UTF-8 decode failed:", decodeErr.message);
      }
    }

    if (row && !row.LICHSUBENH_Decrypted) {
      console.log(
        `[DB_INFO] LICHSUBENH not decrypted for insured id ${idNguoiDuocBh}. DB may lack permission to OPEN SYMMETRIC KEY.`,
      );
    }

    return row;
  } catch (err) {
    console.error(
      "[DB_ERROR] Failed to fetch medical history for",
      idNguoiDuocBh,
      err.message,
    );
    throw err;
  }
}

module.exports.getMedicalHistoryByInsuredId = getMedicalHistoryByInsuredId;
