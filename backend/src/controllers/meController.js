const Contract = require("../models/Contract");
const InsuredPerson = require("../models/InsuredPerson");
const PremiumPayment = require("../models/PremiumPayment");
const { writeAudit } = require("../services/auditService");

async function getMyContracts(req, res) {
  if (req.user.vaiTro !== "NGUOI_DUOC_BAO_HIEM") {
    return res
      .status(403)
      .json({ message: "Only NGUOI_DUOC_BAO_HIEM can use this API" });
  }

  const insured = await InsuredPerson.findOne({ userId: req.user.id }).lean();
  if (!insured) return res.json([]);

  const contracts = await Contract.find({ ndbhId: insured._id }).lean();

  await writeAudit({
    userId: req.user.id,
    hanhDong: "SELECT",
    bangDuLieu: "Contract",
    noiDung: "Nguoi duoc bao hiem xem hop dong cua minh",
  });

  return res.json(contracts);
}

async function getMyPayments(req, res) {
  if (req.user.vaiTro !== "NGUOI_DUOC_BAO_HIEM") {
    return res
      .status(403)
      .json({ message: "Only NGUOI_DUOC_BAO_HIEM can use this API" });
  }

  const insured = await InsuredPerson.findOne({ userId: req.user.id }).lean();
  if (!insured) return res.json([]);

  const contracts = await Contract.find(
    { ndbhId: insured._id },
    { _id: 1 },
  ).lean();
  const contractIds = contracts.map((x) => x._id);
  const payments = await PremiumPayment.find({
    hopDongId: { $in: contractIds },
  }).lean();

  await writeAudit({
    userId: req.user.id,
    hanhDong: "SELECT",
    bangDuLieu: "PremiumPayment",
    noiDung: "Nguoi duoc bao hiem xem qua trinh dong phi",
  });

  return res.json(payments);
}

module.exports = { getMyContracts, getMyPayments };
