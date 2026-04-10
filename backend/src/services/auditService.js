const AccessLog = require("../models/AccessLog");

async function writeAudit({
  userId,
  hanhDong,
  bangDuLieu,
  khoaBanGhi,
  noiDung,
}) {
  if (!userId) return;

  await AccessLog.create({
    userId,
    hanhDong,
    bangDuLieu,
    khoaBanGhi,
    noiDung,
  });
}

module.exports = { writeAudit };
