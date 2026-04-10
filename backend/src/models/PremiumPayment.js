const mongoose = require("mongoose");

const premiumPaymentSchema = new mongoose.Schema(
  {
    hopDongId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contract",
      required: true,
      index: true,
    },
    kyPhi: { type: String, required: true },
    ngayDenHan: { type: Date, required: true, index: true },
    ngayThanhToan: { type: Date },
    soTienPhaiDong: { type: Number, required: true },
    soTienDaDong: { type: Number, default: 0 },
    trangThaiThanhToan: {
      type: String,
      enum: ["CHUA_DONG", "DONG_MOT_PHAN", "DA_DONG"],
      required: true,
      index: true,
    },
    ghiChu: { type: String },
  },
  { timestamps: false },
);

module.exports = mongoose.model("PremiumPayment", premiumPaymentSchema);
