require("dotenv").config();
const { getPool } = require("../src/config/db");
(async () => {
  try {
    const pool = await getPool();
    const result = await pool
      .request()
      .query(
        `IF OBJECT_ID(N'dbo.SEPAY_CHECKOUTS', N'U') IS NULL BEGIN SELECT 0 AS _exists END ELSE BEGIN SELECT TOP 50 ID, ORDER_REF, IDKY, IDNGUOIDUNG, AMOUNT, MATCHED, CREATED_AT FROM dbo.SEPAY_CHECKOUTS ORDER BY CREATED_AT DESC END`,
      );
    console.log(JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
