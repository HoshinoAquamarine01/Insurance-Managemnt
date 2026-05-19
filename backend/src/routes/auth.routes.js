const express = require("express");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  loginRules,
  login,
  updateProfile,
  updatePasswordRules,
  updatePassword,
  logout,
} = require("../controllers/auth.controller");
const { requireRole } = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/login", loginRules, validateRequest, login);
router.post("/logout", logout);
// Only non-insured roles may update profiles or passwords
router.put(
  "/profile/update",
  requireRole(["creator", "accountant", "supervisor", "admin"]),
  updateProfile,
);
router.put(
  "/profile",
  requireRole(["creator", "accountant", "supervisor", "admin"]),
  updateProfile,
);
router.put(
  "/password",
  requireRole(["insured", "creator", "accountant", "supervisor", "admin"]),
  updatePasswordRules,
  validateRequest,
  updatePassword,
);

module.exports = router;
