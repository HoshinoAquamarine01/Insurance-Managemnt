const { getPool, sql } = require("../config/db");
const { executeLogin, executeRegisterUser } = require("../utils/loginAuth");

async function getAllEmployees() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT ND.IDNGUOIDUNG, ND.TENDANGNHAP, ND.HOTEN, ND.EMAIL, ND.TRANGTHAI,
           VR.MAVAITRO, VR.TENVAITRO
    FROM NGUOIDUNG ND
    INNER JOIN VAITRO VR ON ND.IDVAITRO = VR.IDVAITRO
    WHERE VR.MAVAITRO IN ('CREATOR', 'ACCOUNTANT', 'SUPERVISOR', 'ADMIN')
  `);

  return result.recordset;
}

async function createEmployee(payload) {
  const pool = await getPool();

  // Get IDVAITRO from VAITRO table based on MAVAITRO
  const roleResult = await pool
    .request()
    .input("MAVAITRO", sql.VarChar(30), payload.vaiTro)
    .query(`SELECT IDVAITRO FROM VAITRO WHERE MAVAITRO = @MAVAITRO`);

  if (!roleResult.recordset[0]) {
    throw new Error("Role not found");
  }

  const idVaiTro = roleResult.recordset[0].IDVAITRO;

  const result = await executeRegisterUser(pool, sql, {
    tenDangNhap: payload.tenDangNhap,
    matKhau: payload.matKhau,
    hoTen: payload.hoTen,
    email: payload.email || payload.tenDangNhap,
    idVaiTro,
    trangThai: payload.trangThai || "Đang hoạt động",
  });

  if (!result || result.Result !== "SUCCESS") {
    throw new Error(result?.ErrorMessage || "Failed to create employee");
  }

  return result;
}

async function loginEmployee(tenDangNhap, matKhau) {
  const pool = await getPool();
  console.log("[EMP LOGIN DEBUG] Attempting login for:", tenDangNhap);
  const user = await executeLogin(pool, sql, tenDangNhap, matKhau);
  console.log(
    "[EMP LOGIN DEBUG] executeLogin returned:",
    user ? `user with role ${user.MAVAITRO}` : "null",
  );
  if (!user) return null;

  // Check if user is an employee (not INSURED role)
  if (user.MAVAITRO === "INSURED") {
    console.log("[EMP LOGIN DEBUG] User is INSURED, returning null");
    return null;
  }

  console.log("[EMP LOGIN DEBUG] User is employee, returning user");
  return user;
}

async function updateEmployeeProfile(idNguoidung, { fullName, email }) {
  const pool = await getPool();
  const hoTen = String(fullName || "").trim();

  const result = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, idNguoidung)
    .input("HOTEN", sql.NVarChar(100), hoTen)
    .input("EMAIL", sql.VarChar(100), email).query(`
      UPDATE NGUOIDUNG 
      SET HOTEN = @HOTEN, EMAIL = @EMAIL
      WHERE IDNGUOIDUNG = @IDNGUOIDUNG
    `);

  return { success: true, message: "Profile updated successfully" };
}

module.exports = {
  getAllEmployees,
  createEmployee,
  loginEmployee,
  updateEmployeeProfile,
};
