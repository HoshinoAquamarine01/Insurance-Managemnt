require("dotenv").config();
const { getPool } = require("../src/config/db");
(async () => {
  try {
    const pool = await getPool();
    const result = await pool.request().query(`
      SELECT TOP 20 K.IDKY, K.SOTIENPHAIDONG, K.TRANGTHAI, K.NGAYDENHAN, NDB.IDNGUOIDUNG
      FROM KYDONGPHI K
      JOIN HOPDONG H ON K.IDHOPDONG = H.IDHOPDONG
      JOIN NGUOIDUOCBAOHIEM NDB ON H.IDNGUOIDUOCBH = NDB.IDNGUOIDUOCBH
      WHERE K.IDKY = 4 OR K.SOTIENPHAIDONG IN (1000, 10000)
      ORDER BY K.IDKY DESC
    `);
    console.log(JSON.stringify(result.recordset, null, 2));
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
