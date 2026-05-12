const LOGIN_PROCEDURE_NAME = "sp_ValidateLogin";
const REGISTER_PROCEDURE_NAME = "sp_RegisterUser";

function isMissingStoredProcedureError(error) {
  const message = String(error?.message || "");
  return (
    error?.number === 2812 || /Could not find stored procedure/i.test(message)
  );
}

async function executeLogin(pool, sql, tenDangNhap, matKhau) {
  const request = pool
    .request()
    .input("TENDANGNHAP", sql.VarChar(100), tenDangNhap)
    .input("MATKHAU", sql.VarChar(255), matKhau);

  try {
    const result = await request.execute(LOGIN_PROCEDURE_NAME);
    const user = result.recordset[0];

    if (user && !user.Result) {
      return user;
    }
  } catch (error) {
    if (!isMissingStoredProcedureError(error)) {
      throw error;
    }
  }

  const fallbackResult = await pool
    .request()
    .input("TENDANGNHAP", sql.VarChar(100), tenDangNhap)
    .input("MATKHAU", sql.NVarChar(255), matKhau).query(`
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
    `);

  return fallbackResult.recordset[0] || null;
}

function isDuplicateKeyError(error) {
  return error?.number === 2627 || error?.number === 2601;
}

async function executeRegisterUser(pool, sql, payload) {
  const request = pool
    .request()
    .input("TENDANGNHAP", sql.VarChar(100), payload.tenDangNhap)
    .input("MATKHAU", sql.VarChar(255), payload.matKhau)
    .input("HOTEN", sql.NVarChar(100), payload.hoTen)
    .input("EMAIL", sql.VarChar(100), payload.email)
    .input("IDVAITRO", sql.BigInt, payload.idVaiTro)
    .input("TRANGTHAI", sql.NVarChar(30), payload.trangThai);

  try {
    const result = await request.execute(REGISTER_PROCEDURE_NAME);
    return result.recordset[0] || null;
  } catch (error) {
    if (!isMissingStoredProcedureError(error)) {
      throw error;
    }
  }

  const fallbackResult = await pool
    .request()
    .input("TENDANGNHAP", sql.VarChar(100), payload.tenDangNhap)
    .input("MATKHAU", sql.NVarChar(255), payload.matKhau)
    .input("HOTEN", sql.NVarChar(100), payload.hoTen)
    .input("EMAIL", sql.VarChar(100), payload.email)
    .input("IDVAITRO", sql.BigInt, payload.idVaiTro)
    .input("TRANGTHAI", sql.NVarChar(30), payload.trangThai).query(`
      BEGIN TRY
        DECLARE @SALT VARBINARY(16) = CRYPT_GEN_RANDOM(16);
        DECLARE @HASHEDPW VARBINARY(64) = HASHBYTES('SHA2_256', CONVERT(VARCHAR(MAX), @MATKHAU) + CONVERT(VARCHAR(MAX), @SALT));

        INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
        VALUES (@TENDANGNHAP, @HASHEDPW, @HOTEN, @EMAIL, @IDVAITRO, @TRANGTHAI, @SALT, GETDATE());

        SELECT SCOPE_IDENTITY() AS IDNGUOIDUNG, 'SUCCESS' AS Result;
      END TRY
      BEGIN CATCH
        SELECT ERROR_MESSAGE() AS ErrorMessage;
      END CATCH
    `);

  return fallbackResult.recordset[0] || null;
}

module.exports = {
  executeLogin,
  executeRegisterUser,
};
