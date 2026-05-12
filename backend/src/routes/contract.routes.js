const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  contractCreateRules,
  quickCreateContractRules,
  getContracts,
  getInsuredAccounts,
  createContract,
  quickCreateContract,
  getExpiredContracts,
} = require("../controllers/contract.controller");

const router = express.Router();

router.get(
  "/",
  requireRole([
    "admin",
    "giamsat",
    "creator",
    "lap_hop_dong",
    "accountant",
    "ke_toan",
    "supervisor",
    "insured",
  ]),
  getContracts,
);
router.get(
  "/history",
  requireRole([
    "admin",
    "giamsat",
    "creator",
    "lap_hop_dong",
    "accountant",
    "ke_toan",
    "supervisor",
    "insured",
  ]),
  getExpiredContracts,
);
router.get(
  "/insured-accounts",
  requireRole(["admin", "creator", "lap_hop_dong"]),
  getInsuredAccounts,
);
router.post(
  "/quick-create",
  requireRole(["admin", "creator", "lap_hop_dong"]),
  quickCreateContractRules,
  validateRequest,
  quickCreateContract,
);
router.post(
  "/",
  requireRole(["admin", "lap_hop_dong"]),
  contractCreateRules,
  validateRequest,
  createContract,
);

module.exports = router;
