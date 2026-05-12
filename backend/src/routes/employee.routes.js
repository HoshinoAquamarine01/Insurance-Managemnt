const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const { validateRequest } = require("../middlewares/validate.middleware");
const {
  employeeCreateRules,
  employeeLoginRules,
  getEmployees,
  createEmployee,
  loginEmployee,
} = require("../controllers/employee.controller");

const router = express.Router();

router.post("/login", employeeLoginRules, validateRequest, loginEmployee);
router.get("/", requireRole(["admin", "giamsat"]), getEmployees);
router.post(
  "/",
  requireRole(["admin"]),
  employeeCreateRules,
  validateRequest,
  createEmployee,
);

module.exports = router;
