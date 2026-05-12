const { body } = require("express-validator");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../views/apiResponse.view");
const contractModel = require("../models/contract.model");

const contractCreateRules = [
  body("idHopDong").optional({ nullable: true }).isString(),
  body("idKhachHang").notEmpty(),
  body("idNhanVien").optional({ nullable: true }).isString(),
  body("idLoai").notEmpty(),
  body("ngayBatDau").isISO8601(),
  body("ngayKetThuc").isISO8601(),
  body("trangThai").optional({ nullable: true }).isString(),
];

const quickCreateContractRules = [
  body("creatorId").notEmpty(),
  body("accountId").notEmpty(),
  body("fullName").notEmpty(),
  body("gender").notEmpty(),
  body("dateOfBirth").isISO8601(),
  body("workplace").notEmpty(),
  body("permanentAddress").notEmpty(),
  body("temporaryAddress").optional({ nullable: true }).isString(),
  body("contactAddress").notEmpty(),
  body("insuranceType").notEmpty(),
  body("contractValue").isNumeric(),
  body("periodAmount").isNumeric(),
  body("medicalHistory").optional({ nullable: true }).isString(),
  body("startDate").isISO8601(),
  body("endDate").isISO8601(),
];

const getContracts = asyncHandler(async (req, res) => {
  const userContext = req.user; // Role and user info from auth middleware
  console.log("[DEBUG] getContracts - req.user:", userContext);
  try {
    const data = await contractModel.getAllContracts(userContext);
    console.log(
      "[DEBUG] getContracts returned",
      data?.length || 0,
      "contracts",
    );
    return success(res, data, "Contracts fetched");
  } catch (err) {
    console.error("[ERROR] getContracts failed:", err);
    throw err;
  }
});

const getExpiredContracts = asyncHandler(async (req, res) => {
  const data = await contractModel.getExpiredContracts(req.user);
  return success(res, data, "Expired contracts fetched");
});

const getInsuredAccounts = asyncHandler(async (req, res) => {
  const data = await contractModel.getInsuredAccounts();
  return success(res, data, "Insured accounts fetched");
});

const createContract = asyncHandler(async (req, res) => {
  const data = await contractModel.createContract(req.body);
  return success(res, data, "Contract created", 201);
});

const quickCreateContract = asyncHandler(async (req, res) => {
  try {
    console.log("[DEBUG] quickCreateContract - accountId:", req.body.accountId);
    const data = await contractModel.quickCreateContract(req.body);
    return success(res, data, "Contract created", 201);
  } catch (error) {
    console.error("[ERROR] quickCreateContract failed:", error);
    throw error;
  }
});

module.exports = {
  contractCreateRules,
  quickCreateContractRules,
  getContracts,
  getExpiredContracts,
  getInsuredAccounts,
  createContract,
  quickCreateContract,
};
