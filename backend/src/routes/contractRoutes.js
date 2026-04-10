const express = require("express");
const { body, param } = require("express-validator");
const { authenticate } = require("../middleware/auth");
const { authorize } = require("../middleware/authorize");
const { validate } = require("../middleware/validate");
const {
  createContract,
  listContracts,
  getContractById,
  updateContract,
} = require("../controllers/contractController");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize("LAP_HOP_DONG", "ADMIN"),
  [
    body("soHopDong").notEmpty(),
    body("ndbhId").isMongoId(),
    body("loaiBaoHiemId").isMongoId(),
    body("ngayBatDau").isISO8601(),
    body("ngayKetThuc").isISO8601(),
    body("giaTriBaoHiem").isFloat({ gt: 0 }),
    body("mucPhiDongDinhKy").isFloat({ gt: 0 }),
    body("chuKyDongPhi").isIn(["THANG", "QUY", "NAM"]),
    body("trangThaiHopDong").isIn(["HIEU_LUC", "TAM_DUNG", "HET_HAN", "HUY"]),
  ],
  validate,
  createContract,
);

router.get("/", authenticate, listContracts);

router.get(
  "/:id",
  authenticate,
  [param("id").isMongoId()],
  validate,
  getContractById,
);

router.patch(
  "/:id",
  authenticate,
  authorize("LAP_HOP_DONG", "ADMIN"),
  [param("id").isMongoId()],
  validate,
  updateContract,
);

module.exports = router;
