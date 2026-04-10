const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    soHopDong: { type: String, required: true, unique: true, trim: true },
    ndbhId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InsuredPerson",
      required: true,
      index: true,
    },
    loaiBaoHiemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InsuranceType",
      required: true,
      index: true,
    },
    nguoiTaoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    ngayBatDau: { type: Date, required: true },
    ngayKetThuc: { type: Date, required: true },
    giaTriBaoHiem: { type: Number, required: true },
    mucPhiDongDinhKy: { type: Number, required: true },
    chuKyDongPhi: {
      type: String,
      enum: ["THANG", "QUY", "NAM"],
      required: true,
    },
    trangThaiHopDong: {
      type: String,
      enum: ["HIEU_LUC", "TAM_DUNG", "HET_HAN", "HUY"],
      required: true,
    },
    ghiChu: { type: String },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

contractSchema.index({ soHopDong: 1 }, { unique: true });

contractSchema.pre("validate", function validateDates(next) {
  if (this.ngayKetThuc <= this.ngayBatDau) {
    return next(new Error("ngayKetThuc must be greater than ngayBatDau"));
  }
  return next();
});

module.exports = mongoose.model("Contract", contractSchema);
