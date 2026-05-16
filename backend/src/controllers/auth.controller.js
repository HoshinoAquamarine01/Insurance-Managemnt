const { body } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { success, fail } = require("../views/apiResponse.view");
const employeeModel = require("../models/employee.model");
const customerModel = require("../models/customer.model");
const { getPool, sql } = require("../config/db");

const loginRules = [body("tenDangNhap").notEmpty(), body("matKhau").notEmpty()];
const updatePasswordRules = [
  body("userId").notEmpty(),
  body("currentPassword").notEmpty(),
  body("newPassword").isLength({ min: 6 }),
];

function mapRoleToFrontend(mavaitro) {
  const role = String(mavaitro || "")
    .toUpperCase()
    .trim();

  switch (role) {
    case "CREATOR":
      return "creator";
    case "ACCOUNTANT":
      return "accountant";
    case "SUPERVISOR":
      return "supervisor";
    case "INSURED":
      return "insured";
    case "ADMIN":
      return "admin";
    default:
      return "creator";
  }
}

const login = asyncHandler(async (req, res) => {
  const { tenDangNhap, matKhau } = req.body;
  console.log("[AUTH DEBUG] Login attempt:", tenDangNhap);

  // Try login as employee first
  const employee = await employeeModel.loginEmployee(tenDangNhap, matKhau);
  console.log(
    "[AUTH DEBUG] Employee login result:",
    employee ? "FOUND" : "NOT FOUND",
  );
  if (employee) {
    return success(
      res,
      {
        id: String(employee.IDNGUOIDUNG),
        name: employee.HOTEN,
        email: employee.EMAIL || employee.TENDANGNHAP,
        role: mapRoleToFrontend(employee.MAVAITRO),
        accountType: "employee",
      },
      "Login success",
    );
  }

  // Try login as customer (insured person)
  console.log("[AUTH DEBUG] Trying customer login...");
  const customer = await customerModel.loginCustomer(tenDangNhap, matKhau);
  console.log(
    "[AUTH DEBUG] Customer login result:",
    customer ? "FOUND" : "NOT FOUND",
  );
  if (customer) {
    return success(
      res,
      {
        id: String(customer.IDNGUOIDUNG),
        name: customer.HOTEN,
        email: customer.EMAIL || customer.TENDANGNHAP,
        role: "insured",
        accountType: "customer",
      },
      "Login success",
    );
  }

  console.log("[AUTH DEBUG] Login failed for:", tenDangNhap);
  return fail(res, "Invalid username or password", 401);
});

const updateProfile = asyncHandler(async (req, res) => {
  const { userId, accountType, fullName, email } = req.body;

  if (!userId || !accountType) {
    return fail(res, "Missing userId or accountType", 400);
  }

  const idNguoidung = parseInt(userId, 10);

  try {
    if (accountType === "employee") {
      await employeeModel.updateEmployeeProfile(idNguoidung, {
        fullName,
        email,
      });
    } else if (accountType === "customer") {
      await customerModel.updateCustomerProfile(idNguoidung, {
        fullName,
        email,
      });
    } else {
      return fail(res, "Invalid account type", 400);
    }

    return success(res, null, "Profile updated successfully");
  } catch (error) {
    console.error("Profile update error:", error);
    return fail(res, error.message || "Failed to update profile", 500);
  }
});

const updatePassword = asyncHandler(async (req, res) => {
  const { userId, currentPassword, newPassword } = req.body;

  if (!userId || !currentPassword || !newPassword) {
    return fail(res, "Missing password update fields", 400);
  }

  if (String(currentPassword) === String(newPassword)) {
    return fail(
      res,
      "New password must be different from current password",
      400,
    );
  }

  const idNguoidung = parseInt(userId, 10);
  if (!Number.isFinite(idNguoidung)) {
    return fail(res, "Invalid userId", 400);
  }

  const pool = await getPool();

  const verifyResult = await pool
    .request()
    .input("IDNGUOIDUNG", sql.Int, idNguoidung)
    .input("CURRENT_PASSWORD", sql.NVarChar(255), String(currentPassword))
    .query(`
      SELECT ND.IDNGUOIDUNG
      FROM NGUOIDUNG ND
      WHERE ND.IDNGUOIDUNG = @IDNGUOIDUNG
        AND ND.MATKHAU = HASHBYTES('SHA2_256', CONVERT(VARCHAR(MAX), @CURRENT_PASSWORD) + CONVERT(VARCHAR(MAX), ND.SALT))
    `);

  if (!verifyResult.recordset.length) {
    return fail(res, "Current password is incorrect", 400);
  }

  await pool
    .request()
    .input("IDNGUOIDUNG", sql.Int, idNguoidung)
    .input("NEW_PASSWORD", sql.NVarChar(255), String(newPassword)).query(`
      DECLARE @HASHEDPW VARBINARY(64);

      SELECT @HASHEDPW = HASHBYTES(
        'SHA2_256',
        CONVERT(VARCHAR(MAX), @NEW_PASSWORD) + CONVERT(VARCHAR(MAX), SALT)
      )
      FROM NGUOIDUNG
      WHERE IDNGUOIDUNG = @IDNGUOIDUNG;

      UPDATE ND
      SET ND.MATKHAU = @HASHEDPW
      FROM NGUOIDUNG ND
      WHERE ND.IDNGUOIDUNG = @IDNGUOIDUNG
    `);

  return success(res, null, "Password updated successfully");
});

module.exports = {
  loginRules,
  updatePasswordRules,
  login,
  updateProfile,
  updatePassword,
};
