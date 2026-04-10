const express = require("express");
const { body } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const {
  createInsuranceType,
  createAccountingAssignment,
  createSupervisorAssignment,
  getAuditLogs,
} = require("../controllers/adminController");

const router = express.Router();

router.post(
  "/insurance-types",
  authenticate,
  authorize("ADMIN"),
  [body("maLoai").notEmpty(), body("tenLoai").notEmpty()],
  validate,
  createInsuranceType,
);

router.post(
  "/assignments/accounting",
  authenticate,
  authorize("ADMIN"),
  [
    body("userId").isMongoId(),
    body("loaiBaoHiemId").isMongoId(),
    body("ngayPhanCong").isISO8601(),
  ],
  validate,
  createAccountingAssignment,
);

router.post(
  "/assignments/supervisor",
  authenticate,
  authorize("ADMIN"),
  [
    body("userId").isMongoId(),
    body("loaiBaoHiemId").isMongoId(),
    body("ngayPhanCong").isISO8601(),
  ],
  validate,
  createSupervisorAssignment,
);

router.get("/audit-logs", authenticate, authorize("ADMIN"), getAuditLogs);

module.exports = router;
