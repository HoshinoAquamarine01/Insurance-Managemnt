const express = require("express");
const { requireRole } = require("../middlewares/auth.middleware");
const {
  getUsers,
  getInsuranceTypes,
  getAssignments,
  getActivityFeed,
  createUser,
  updateUser,
  deleteUser,
  createInsuranceType,
  updateInsuranceType,
  deleteInsuranceType,
  createAssignment,
  updateAssignment,
  deleteAssignment,
  createContract,
  updateContract,
  deleteContract,
} = require("../controllers/admin.controller");

const router = express.Router();

router.get("/users", requireRole(["admin"]), getUsers);
router.post("/users", requireRole(["admin"]), createUser);
router.put("/users/:id", requireRole(["admin"]), updateUser);
router.delete("/users/:id", requireRole(["admin"]), deleteUser);

router.get("/insurance-types", requireRole(["admin"]), getInsuranceTypes);
router.post("/insurance-types", requireRole(["admin"]), createInsuranceType);
router.put("/insurance-types/:id", requireRole(["admin"]), updateInsuranceType);
router.delete(
  "/insurance-types/:id",
  requireRole(["admin"]),
  deleteInsuranceType,
);

router.get("/assignments", requireRole(["admin"]), getAssignments);
router.post("/assignments", requireRole(["admin"]), createAssignment);
router.put("/assignments/:id", requireRole(["admin"]), updateAssignment);
router.delete("/assignments/:id", requireRole(["admin"]), deleteAssignment);

router.post("/contracts", requireRole(["admin"]), createContract);
router.put("/contracts/:id", requireRole(["admin"]), updateContract);
router.delete("/contracts/:id", requireRole(["admin"]), deleteContract);

router.get("/activity", requireRole(["admin"]), getActivityFeed);

module.exports = router;
