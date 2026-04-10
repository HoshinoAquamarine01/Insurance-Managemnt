const express = require("express");
const { body } = require("express-validator");
const { validate } = require("../middleware/validate");
const { register, login } = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  [
    body("username").isLength({ min: 3, max: 50 }),
    body("password").isLength({ min: 6, max: 72 }),
    body("hoTen").notEmpty(),
    body("vaiTro").isIn([
      "LAP_HOP_DONG",
      "NGUOI_DUOC_BAO_HIEM",
      "KE_TOAN",
      "GIAM_SAT",
      "ADMIN",
    ]),
  ],
  validate,
  register,
);

router.post(
  "/login",
  [body("username").notEmpty(), body("password").notEmpty()],
  validate,
  login,
);

module.exports = router;
