const express = require("express");
const { body, param } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const {
  createInsuredPerson,
  getInsuredPersonById,
} = require("../controllers/insuredController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("LAP_HOP_DONG", "ADMIN"),
  [
    body("hoTen").notEmpty(),
    body("phai").notEmpty(),
    body("ngaySinh").isISO8601(),
  ],
  validate,
  createInsuredPerson,
);

router.get(
  "/:id",
  authenticate,
  [param("id").isMongoId()],
  validate,
  getInsuredPersonById,
);

module.exports = router;
