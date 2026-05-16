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
// Support legacy/frontend path: PUT /api/auth/profile
router.put("/profile", updateProfile);
router.put("/password", updatePasswordRules, validateRequest, updatePassword);

module.exports = router;
