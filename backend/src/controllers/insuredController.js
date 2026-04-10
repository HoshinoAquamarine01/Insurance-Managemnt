const mongoose = require("mongoose");
const InsuredPerson = require("../models/InsuredPerson");
const { encryptText, decryptText } = require("../utils/crypto");
const { writeAudit } = require("../services/auditService");

async function createInsuredPerson(req, res) {
  const payload = req.body;

  if (payload.userId && !mongoose.Types.ObjectId.isValid(payload.userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const doc = await InsuredPerson.create({
    userId: payload.userId || undefined,
    hoTen: payload.hoTen,
    phai: payload.phai,
    ngaySinh: payload.ngaySinh,
    coQuanCongTac: payload.coQuanCongTac,
    diaChiThuongTruEnc: encryptText(payload.diaChiThuongTru),
    diaChiTamTruEnc: encryptText(payload.diaChiTamTru),
    diaChiLienLacEnc: encryptText(payload.diaChiLienLac),
    lichSuBenhEnc: encryptText(payload.lichSuBenh),
  });

  await writeAudit({
    userId: req.user.id,
    hanhDong: "INSERT",
    bangDuLieu: "InsuredPerson",
    khoaBanGhi: doc._id.toString(),
    noiDung: "Tao nguoi duoc bao hiem",
  });

  return res.status(201).json({ ndbhId: doc._id });
}

async function getInsuredPersonById(req, res) {
  const doc = await InsuredPerson.findById(req.params.id).lean();
  if (!doc) return res.status(404).json({ message: "Not found" });

  if (
    req.user.vaiTro === "NGUOI_DUOC_BAO_HIEM" &&
    String(doc.userId || "") !== req.user.id
  ) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const result = {
    ...doc,
    diaChiThuongTru: decryptText(doc.diaChiThuongTruEnc),
    diaChiTamTru: decryptText(doc.diaChiTamTruEnc),
    diaChiLienLac: decryptText(doc.diaChiLienLacEnc),
    lichSuBenh: decryptText(doc.lichSuBenhEnc),
  };

  delete result.diaChiThuongTruEnc;
  delete result.diaChiTamTruEnc;
  delete result.diaChiLienLacEnc;
  delete result.lichSuBenhEnc;

  await writeAudit({
    userId: req.user.id,
    hanhDong: "SELECT",
    bangDuLieu: "InsuredPerson",
    khoaBanGhi: doc._id.toString(),
    noiDung: "Xem thong tin NDBH",
  });

  return res.json(result);
}

module.exports = { createInsuredPerson, getInsuredPersonById };
