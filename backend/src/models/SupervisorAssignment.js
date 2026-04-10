const mongoose = require("mongoose");

const supervisorAssignmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loaiBaoHiemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InsuranceType",
      required: true,
      index: true,
    },
    ngayPhanCong: { type: Date, required: true },
    trangThai: { type: String, default: "ACTIVE" },
  },
  { timestamps: false },
);

supervisorAssignmentSchema.index(
  { userId: 1, loaiBaoHiemId: 1 },
  { unique: true },
);

module.exports = mongoose.model(
  "SupervisorAssignment",
  supervisorAssignmentSchema,
);
