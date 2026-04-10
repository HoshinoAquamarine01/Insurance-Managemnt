const mongoose = require("mongoose");

const encryptedPayload = {
  iv: { type: String, required: true },
  content: { type: String, required: true },
  tag: { type: String, required: true },
};

const insuredPersonSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    hoTen: { type: String, required: true },
    phai: { type: String, required: true },
    ngaySinh: { type: Date, required: true },
    coQuanCongTac: { type: String },
    diaChiThuongTruEnc: encryptedPayload,
    diaChiTamTruEnc: encryptedPayload,
    diaChiLienLacEnc: encryptedPayload,
    lichSuBenhEnc: encryptedPayload,
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

module.exports = mongoose.model("InsuredPerson", insuredPersonSchema);
