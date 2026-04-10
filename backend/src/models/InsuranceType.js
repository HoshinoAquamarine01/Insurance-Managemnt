const mongoose = require("mongoose");

const insuranceTypeSchema = new mongoose.Schema(
  {
    maLoai: { type: String, required: true, unique: true, trim: true },
    tenLoai: { type: String, required: true },
    moTa: { type: String },
    trangThai: { type: String, default: "ACTIVE" },
  },
  { timestamps: false },
);

module.exports = mongoose.model("InsuranceType", insuranceTypeSchema);
