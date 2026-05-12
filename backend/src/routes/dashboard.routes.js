const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const { getSummary } = require("../controllers/dashboard.controller");

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
  getSummary,
);

module.exports = router;
