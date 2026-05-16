const path = require("path");
const sql = require("mssql/msnodesqlv8");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const fallbackConnectionString =
  "Driver={ODBC Driver 17 for SQL Server};Server=localhost;Database=QLBH;Trusted_Connection=Yes;TrustServerCertificate=Yes;";

async function run() {
  const pool = await sql.connect({
    connectionString:
      process.env.DB_CONNECTION_STRING || fallbackConnectionString,
  });

  try {
    await pool.request().batch(`
      ALTER TABLE HOPDONG ALTER COLUMN TRANGTHAI NVARCHAR(20);

      UPDATE LOAIBAOHIEM
      SET TENLOAI = N'Bảo hiểm sức khỏe',
          MOTA = N'Bảo hiểm chi phí khám chữa bệnh'
      WHERE IDLOAI = 1;

      UPDATE LOAIBAOHIEM
      SET TENLOAI = N'Bảo hiểm nhân thọ',
          MOTA = N'Bảo hiểm bảo vệ gia đình và người thân'
      WHERE IDLOAI = 2;

      UPDATE LOAIBAOHIEM
      SET TENLOAI = N'Bảo hiểm xe cơ giới',
          MOTA = N'Bảo hiểm vật chất và trách nhiệm'
      WHERE IDLOAI = 3;

      UPDATE LOAIBAOHIEM
      SET TENLOAI = N'Bảo hiểm tài sản',
          MOTA = N'Bảo hiểm tài sản công ty và cá nhân'
      WHERE IDLOAI = 4;

      UPDATE HOPDONG
      SET TRANGTHAI = N'Còn thời hạn'
      WHERE TRANGTHAI IS NULL
         OR TRANGTHAI LIKE '%?%'
         OR TRANGTHAI LIKE N'%th%i%h%n%';

      UPDATE THANHTOAN
      SET TRANGTHAI = N'Chờ kế toán xác nhận'
      WHERE NGUOIXACNHAN IS NULL
        AND NGAYXACNHAN IS NULL
        AND (
          TRANGTHAI = N'Đã đóng'
          OR TRANGTHAI = N'Đã thanh toán'
        );
    `);

    const verification = await pool.request().query(`
      SELECT IDLOAI, TENLOAI FROM LOAIBAOHIEM ORDER BY IDLOAI;
      SELECT TOP 10 IDHOPDONG, TRANGTHAI FROM HOPDONG ORDER BY IDHOPDONG DESC;
    `);

    console.log("Unicode DB fix applied successfully.");
    console.log(JSON.stringify(verification.recordsets, null, 2));
  } finally {
    await pool.close();
  }
}

run().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
