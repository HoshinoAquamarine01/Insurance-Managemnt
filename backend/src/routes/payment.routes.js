const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  createCheckoutSessionRules,
  confirmCheckoutSessionRules,
  reportTransferredPaymentRules,
  confirmAccountingPaymentRules,
  ipnNotificationRules,
  handleSePaySuccessRedirect,
  handleSePayErrorRedirect,
  handleSePayCancelRedirect,
  getPayments,
  getPaymentSummary,
  createCheckoutSession,
  confirmCheckoutSession,
  reportTransferredPayment,
  recordManualBankTransfer,
  confirmAccountingPayment,
  cancelAccountingPayment,
  ipnNotification,
} = require("../controllers/payment.controller");

const router = express.Router();

router.get(
  "/summary",
  requireRole([
    "creator",
    "accountant",
    "supervisor",
    "insured",
    "admin",
    "giamsat",
    "ke_toan",
    "lap_hop_dong",
  ]),
  getPaymentSummary,
);
router.get(
  "/",
  requireRole([
    "creator",
    "accountant",
    "supervisor",
    "insured",
    "admin",
    "giamsat",
    "ke_toan",
    "lap_hop_dong",
  ]),
  getPayments,
);

router.post(
  "/checkout-session",
  requireRole(["insured"]),
  createCheckoutSessionRules,
  validateRequest,
  createCheckoutSession,
);

router.get(
  "/checkout/confirm",
  requireRole(["insured"]),
  // Ensure numeric amount and integer result code for reliable validation
  confirmCheckoutSessionRules,
  validateRequest,
  confirmCheckoutSession,
);

router.post(
  "/checkout/report-transferred",
  requireRole(["insured"]),
  reportTransferredPaymentRules,
  validateRequest,
  reportTransferredPayment,
);

router.post(
  "/manual-bank-transfer",
  requireRole(["accountant", "admin", "ke_toan"]),
  recordManualBankTransfer,
);

router.post(
  "/sepay/ipn",
  ipnNotificationRules,
  validateRequest,
  ipnNotification,
);

// Debug route to inspect in-memory SePay state (only available to admins)
if (String(process.env.SEPAY_DEBUG || "").toLowerCase() === "true") {
  router.get("/sepay/debug", requireRole(["admin"]), (req, res) => {
    const data = {
      orders: global.sepayOrders || {},
      lastIpn: global.sepayLastIpn || null,
    };
    return res
      .status(200)
      .json({ success: true, message: "SePay debug", data });
  });
}

router.post(
  "/:id/confirm",
  requireRole(["accountant", "admin"]),
  confirmAccountingPaymentRules,
  validateRequest,
  confirmAccountingPayment,
);

router.put(
  "/:id/confirm",
  requireRole(["accountant", "admin"]),
  confirmAccountingPaymentRules,
  validateRequest,
  confirmAccountingPayment,
);

router.put(
  "/:id/cancel",
  requireRole(["accountant", "admin"]),
  confirmAccountingPaymentRules,
  validateRequest,
  cancelAccountingPayment,
);

// SePay redirect endpoints (no auth required)
router.get("/success", handleSePaySuccessRedirect);
router.get("/error", handleSePayErrorRedirect);
router.get("/cancel", handleSePayCancelRedirect);

module.exports = router;
