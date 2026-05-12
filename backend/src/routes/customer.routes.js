const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  customerCreateRules,
  getCustomers,
  createCustomer,
  getCustomerContracts,
  getCustomerPayments,
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
