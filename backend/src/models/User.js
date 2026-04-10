const mongoose = require("mongoose");
const { ROLES } = require("../utils/roles");

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    hoTen: { type: String, required: true },
    email: { type: String, unique: true, sparse: true, lowercase: true },
    soDienThoai: { type: String },
    vaiTro: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
      default: ROLES.NGUOI_DUOC_BAO_HIEM,
    },
    trangThai: { type: String, default: "ACTIVE" },
  },
  { timestamps: { createdAt: "createdAt", updatedAt: "updatedAt" } },
);

module.exports = mongoose.model("User", userSchema);
