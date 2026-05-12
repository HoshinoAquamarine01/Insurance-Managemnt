const { body } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { success, fail } = require("../views/apiResponse.view");
const employeeModel = require("../models/employee.model");

const employeeCreateRules = [
  body("idNhanVien").notEmpty(),
  body("tenDangNhap").isLength({ min: 4, max: 50 }),
  body("matKhau").isLength({ min: 6 }),
  body("vaiTro").notEmpty(),
  body("hoTen").notEmpty(),
  body("gioiTinh").notEmpty(),
  body("diaChi").notEmpty(),
  body("trangThai").notEmpty(),
];

const employeeLoginRules = [
  body("tenDangNhap").notEmpty(),
  body("matKhau").notEmpty(),
];

const getEmployees = asyncHandler(async (req, res) => {
  const data = await employeeModel.getAllEmployees();
  return success(res, data, "Employees fetched");
});

const createEmployee = asyncHandler(async (req, res) => {
  await employeeModel.createEmployee(req.body);
  return success(res, null, "Employee created", 201);
});

const loginEmployee = asyncHandler(async (req, res) => {
  const user = await employeeModel.loginEmployee(
    req.body.tenDangNhap,
    req.body.matKhau,
  );

  if (!user) {
    return fail(res, "Invalid username or password", 401);
  }

  return success(res, user, "Login success");
});

module.exports = {
  employeeCreateRules,
  employeeLoginRules,
  getEmployees,
  createEmployee,
  loginEmployee,
};
