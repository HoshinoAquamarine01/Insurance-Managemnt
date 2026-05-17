const { body } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../views/apiResponse.view");
const customerModel = require("../models/customer.model");

const customerCreateRules = [
  body("idKhachHang").notEmpty(),
  body("tenDangNhap").isLength({ min: 4, max: 50 }),
  body("matKhau").isLength({ min: 6 }),
  body("ngaySinh").isISO8601(),
  body("hoTen").notEmpty(),
  body("gioiTinh").notEmpty(),
  body("diaChi").notEmpty(),
  body("trangThaiHoSo").notEmpty(),
  body("lichSuBenh").optional().isString(),
  body("cccd").notEmpty().isLength({ min: 9, max: 20 }),
];

const getCustomers = asyncHandler(async (req, res) => {
  const data = await customerModel.getAllCustomers();
  return success(res, data, "Customers fetched");
});

const getMedicalHistory = asyncHandler(async (req, res) => {
  const insuredId = Number(req.params.id);
  if (!Number.isInteger(insuredId) || insuredId <= 0) {
    throw new Error("Invalid insured id");
  }

  const data = await customerModel.getMedicalHistoryByInsuredId(insuredId);
  return success(res, data, "Medical history fetched");
});

const createCustomer = asyncHandler(async (req, res) => {
  await customerModel.createCustomer(req.body);
  return success(res, null, "Customer created", 201);
});

const getCustomerContracts = asyncHandler(async (req, res) => {
  const targetCustomerId =
    String(req.user?.role || "").toLowerCase() === "insured" && req.user?.id
      ? req.user.id
      : req.params.id;

  const data = await customerModel.getContractsByCustomer(targetCustomerId);
  return success(res, data, "Customer contracts fetched");
});

const getCustomerPayments = asyncHandler(async (req, res) => {
  const targetCustomerId =
    String(req.user?.role || "").toLowerCase() === "insured" && req.user?.id
      ? req.user.id
      : req.params.id;

  const data = await customerModel.getPaymentsByCustomer(targetCustomerId);
  return success(res, data, "Customer payments fetched");
});

module.exports = {
  customerCreateRules,
  getCustomers,
  createCustomer,
  getCustomerContracts,
  getCustomerPayments,
  getMedicalHistory,
};
