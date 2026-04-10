const mongoose = require("mongoose");

const accessLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    hanhDong: {
      type: String,
      enum: ["SELECT", "INSERT", "UPDATE", "DELETE", "EXPORT"],
      required: true,
    },
    bangDuLieu: { type: String, required: true },
    khoaBanGhi: { type: String },
    noiDung: { type: String },
    thoiGian: { type: Date, default: Date.now },
  },
  { timestamps: false },
);

module.exports = mongoose.model("AccessLog", accessLogSchema);
