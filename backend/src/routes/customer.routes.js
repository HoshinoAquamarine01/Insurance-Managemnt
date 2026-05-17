const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  customerCreateRules,
  getCustomers,
  createCustomer,
  getCustomerContracts,
  getCustomerPayments,
  getMedicalHistory,
} = require("../controllers/customer.controller");

const router = express.Router();

router.get(
  "/",
  requireRole(["admin", "giamsat", "lap_hop_dong"]),
  getCustomers,
);
router.get(
  "/:id/contracts",
  requireRole([
    "insured",
    "creator",
    "accountant",
    "supervisor",
    "admin",
    "giamsat",
    "lap_hop_dong",
    "ke_toan",
  ]),
  getCustomerContracts,
);
router.get(
  "/:id/medical-history",
  requireRole(["admin", "giamsat", "supervisor"]),
  // returns decrypted LICHSUBENH_Decrypted where permitted
  getMedicalHistory,
);
router.get(
  "/:id/payments",
  requireRole([
    "insured",
    "creator",
    "accountant",
    "supervisor",
    "admin",
    "giamsat",
    "lap_hop_dong",
    "ke_toan",
  ]),
  getCustomerPayments,
);
router.post(
  "/",
  requireRole(["creator"]),
  customerCreateRules,
  validateRequest,
  createCustomer,
);

module.exports = router;
