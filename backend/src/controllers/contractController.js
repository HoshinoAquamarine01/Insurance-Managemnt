const Contract = require("../models/Contract");
const AccountingAssignment = require("../models/AccountingAssignment");
const SupervisorAssignment = require("../models/SupervisorAssignment");
const { writeAudit } = require("../services/auditService");

async function createContract(req, res) {
  const contract = await Contract.create({
    ...req.body,
    nguoiTaoId: req.user.id,
  });

  await writeAudit({
    userId: req.user.id,
    hanhDong: "INSERT",
    bangDuLieu: "Contract",
    khoaBanGhi: contract._id.toString(),
    noiDung: "Tao hop dong bao hiem",
  });

  return res.status(201).json(contract);
}

async function listContracts(req, res) {
  let filter = {};

  if (req.user.vaiTro === "LAP_HOP_DONG") {
    filter = { nguoiTaoId: req.user.id };
  }

  if (req.user.vaiTro === "KE_TOAN") {
    const assignments = await AccountingAssignment.find({
      userId: req.user.id,
      trangThai: "ACTIVE",
    }).lean();

    filter = {
      loaiBaoHiemId: { $in: assignments.map((x) => x.loaiBaoHiemId) },
    };
  }

  if (req.user.vaiTro === "GIAM_SAT") {
    const assignments = await SupervisorAssignment.find({
      userId: req.user.id,
      trangThai: "ACTIVE",
    }).lean();

    filter = {
      loaiBaoHiemId: { $in: assignments.map((x) => x.loaiBaoHiemId) },
    };
  }

  if (req.user.vaiTro === "NGUOI_DUOC_BAO_HIEM") {
    return res.status(403).json({ message: "Use /api/me/contracts" });
  }

  const contracts = await Contract.find(filter)
    .populate("ndbhId", "hoTen")
    .populate("loaiBaoHiemId", "maLoai tenLoai")
    .sort({ createdAt: -1 })
    .lean();

  await writeAudit({
    userId: req.user.id,
    hanhDong: "SELECT",
    bangDuLieu: "Contract",
    noiDung: "Xem danh sach hop dong",
  });

  return res.json(contracts);
}

async function getContractById(req, res) {
  const contract = await Contract.findById(req.params.id)
    .populate("ndbhId", "hoTen userId")
    .lean();

  if (!contract) return res.status(404).json({ message: "Not found" });

  if (
    req.user.vaiTro === "LAP_HOP_DONG" &&
    String(contract.nguoiTaoId) !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (
    req.user.vaiTro === "NGUOI_DUOC_BAO_HIEM" &&
    String(contract.ndbhId?.userId || "") !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  if (req.user.vaiTro === "KE_TOAN") {
    const exists = await AccountingAssignment.exists({
      userId: req.user.id,
      loaiBaoHiemId: contract.loaiBaoHiemId,
      trangThai: "ACTIVE",
    });
    if (!exists) return res.status(403).json({ message: "Forbidden" });
  }

  if (req.user.vaiTro === "GIAM_SAT") {
    const exists = await SupervisorAssignment.exists({
      userId: req.user.id,
      loaiBaoHiemId: contract.loaiBaoHiemId,
      trangThai: "ACTIVE",
    });
    if (!exists) return res.status(403).json({ message: "Forbidden" });
  }

  await writeAudit({
    userId: req.user.id,
    hanhDong: "SELECT",
    bangDuLieu: "Contract",
    khoaBanGhi: contract._id.toString(),
    noiDung: "Xem chi tiet hop dong",
  });

  return res.json(contract);
}

async function updateContract(req, res) {
  const contract = await Contract.findById(req.params.id);
  if (!contract) return res.status(404).json({ message: "Not found" });

  if (
    req.user.vaiTro === "LAP_HOP_DONG" &&
    String(contract.nguoiTaoId) !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  Object.assign(contract, req.body);
  await contract.save();

  await writeAudit({
    userId: req.user.id,
    hanhDong: "UPDATE",
    bangDuLieu: "Contract",
    khoaBanGhi: contract._id.toString(),
    noiDung: "Cap nhat hop dong",
  });

  return res.json(contract);
}

module.exports = {
  createContract,
  listContracts,
  getContractById,
  updateContract,
};
