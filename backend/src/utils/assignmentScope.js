const { sql } = require("../config/db");

const SCOPED_ROLES = new Set([
  "accountant",
  "ke_toan",
  "supervisor",
  "giamsat",
]);

const ROLE_TO_ASSIGNMENT_CODE = {
  accountant: "ACCOUNTANT",
  ke_toan: "ACCOUNTANT",
  supervisor: "SUPERVISOR",
  giamsat: "SUPERVISOR",
};

function isScopedRole(role) {
  return SCOPED_ROLES.has(String(role || "").toLowerCase());
}

async function getAssignedInsuranceTypeIds(pool, userId, role) {
  if (!isScopedRole(role)) {
    return null;
  }

  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    return [];
  }

  const assignmentCode =
    ROLE_TO_ASSIGNMENT_CODE[String(role || "").toLowerCase()] || null;

  const result = await pool
    .request()
    .input("IDNGUOIDUNG", sql.BigInt, numericUserId)
    .input("LOAIPHANCONG", sql.VarChar(20), assignmentCode).query(`
      SELECT DISTINCT P.IDLOAI
      FROM PHANCONG P
      WHERE P.IDNGUOIDUNG = @IDNGUOIDUNG
        AND (
          P.NGAYBATDAU IS NULL
          OR P.NGAYBATDAU <= CAST(GETDATE() AS DATE)
        )
        AND (
          P.NGAYKETTHUC IS NULL
          OR P.NGAYKETTHUC >= CAST(GETDATE() AS DATE)
        )
        AND (
          P.LOAIPHANCONG IS NULL
          OR LTRIM(RTRIM(P.LOAIPHANCONG)) = ''
          OR UPPER(P.LOAIPHANCONG) = @LOAIPHANCONG
        );
    `);

  return result.recordset
    .map((row) => Number(row.IDLOAI))
    .filter((value) => Number.isInteger(value) && value > 0);
}

module.exports = {
  isScopedRole,
  getAssignedInsuranceTypeIds,
};
