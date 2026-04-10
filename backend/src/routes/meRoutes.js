const express = require("express");
const { authenticate } = require("../middleware/auth");
const {
  getMyContracts,
  getMyPayments,
} = require("../controllers/meController");

const router = express.Router();

router.get("/contracts", authenticate, getMyContracts);

router.get("/payments", authenticate, getMyPayments);

module.exports = router;
