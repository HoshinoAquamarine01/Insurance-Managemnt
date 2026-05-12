const express = require("express");
const authRoutes = require("./auth.routes");
const employeeRoutes = require("./employee.routes");
const customerRoutes = require("./customer.routes");
const contractRoutes = require("./contract.routes");
const paymentRoutes = require("./payment.routes");
const dashboardRoutes = require("./dashboard.routes");
const adminRoutes = require("./admin.routes");
const settingsRoutes = require("./settings.routes");
const {
  handleSePaySuccessRedirect,
  handleSePayErrorRedirect,
  handleSePayCancelRedirect,
} = require("../controllers/payment.controller");

const router = express.Router();

router.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Backend is running" });
});

router.get("/payment/success", handleSePaySuccessRedirect);
router.get("/payment/error", handleSePayErrorRedirect);
router.get("/payment/cancel", handleSePayCancelRedirect);

router.use("/auth", authRoutes);
router.use("/employees", employeeRoutes);
router.use("/customers", customerRoutes);
router.use("/contracts", contractRoutes);
router.use("/payments", paymentRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/admin", adminRoutes);
router.use("/settings", settingsRoutes);

module.exports = router;
