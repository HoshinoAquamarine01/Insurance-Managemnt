const express = require("express");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  loginRules,
  login,
  updateProfile,
  updatePasswordRules,
  updatePassword,
} = require("../controllers/auth.controller");

const router = express.Router();

router.post("/login", loginRules, validateRequest, login);
router.put("/profile/update", updateProfile);
router.put(
  "/password/update",
  updatePasswordRules,
  validateRequest,
  updatePassword,
);

module.exports = router;
