const defaultAuthMode = String(process.env.DB_AUTH_MODE || "sql").toLowerCase();
const sqlClient =
  defaultAuthMode === "windows"
    ? require("mssql/msnodesqlv8")
    : require("mssql");
require("dotenv").config({ path: "../.env" });

function parseServerAndInstance(rawServer) {
  const serverValue = String(rawServer || "").trim();

  if (!serverValue.includes("\\")) {
    return { server: serverValue || "localhost", instanceName: undefined };
  }

  const [hostPart, instancePart] = serverValue.split("\\");
  const host = hostPart.trim();
  const instanceName = (instancePart || "").trim() || undefined;

  return {
    server: host || "localhost",
    instanceName,
  };
}

const rawServer = process.env.DB_SERVER || "";
const { server, instanceName } = parseServerAndInstance(rawServer);
let config;

if (defaultAuthMode === "windows") {
  const odbcDriver =
    process.env.DB_ODBC_DRIVER || "ODBC Driver 17 for SQL Server";

  const connectionParts = [
    `Driver={${odbcDriver}}`,
    `Server=${instanceName ? `${server}\\${instanceName}` : server}`,
    `Database=${process.env.DB_NAME}`,
    "Trusted_Connection=Yes",
    `TrustServerCertificate=${String(process.env.DB_TRUST_SERVER_CERT || "true") === "true" ? "Yes" : "No"}`,
    "Connection Timeout=5",
  ];

  config = {
    connectionString: connectionParts.join(";") + ";",
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
} else {
  config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: rawServer.includes("\\") ? rawServer : server,
    database: process.env.DB_NAME,
    port: instanceName ? undefined : Number(process.env.DB_PORT || 1433),
    options: {
      encrypt: String(process.env.DB_ENCRYPT || "false") === "true",
      trustServerCertificate:
        String(process.env.DB_TRUST_SERVER_CERT || "true") === "true",
      instanceName: rawServer.includes("\\") ? undefined : instanceName,
      connectionTimeout: 5000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

async function createAdmin() {
  let pool;

  try {
    pool = new sqlClient.ConnectionPool(config);
    await pool.connect();
    console.log("✓ Connected to database");

    // Check if ADMIN role exists, if not create it
    const adminRoleCheck = await pool
      .request()
      .input("MAVAITRO", sqlClient.VarChar(30), "ADMIN")
      .query("SELECT IDVAITRO FROM VAITRO WHERE MAVAITRO = @MAVAITRO");

    let adminRoleId;
    if (!adminRoleCheck.recordset[0]) {
      console.log("⚠ ADMIN role not found, creating...");
      const adminRoleInsert = await pool
        .request()
        .input("MAVAITRO", sqlClient.VarChar(30), "ADMIN")
        .input("TENVAITRO", sqlClient.NVarChar(100), "Quản trị viên")
        .query(
          "INSERT INTO VAITRO (MAVAITRO, TENVAITRO) VALUES (@MAVAITRO, @TENVAITRO); SELECT SCOPE_IDENTITY() AS IDVAITRO",
        );
      adminRoleId = adminRoleInsert.recordset[0].IDVAITRO;
      console.log("✓ ADMIN role created");
    } else {
      adminRoleId = adminRoleCheck.recordset[0].IDVAITRO;
      console.log("✓ ADMIN role found");
    }

    // Admin credentials
    const username = "admin";
    const password = "Admin@123456";
    const fullName = "Quản trị hệ thống";
    const email = "admin@qlbh.local";

    // Check if admin already exists
    const existingAdmin = await pool
      .request()
      .input("TENDANGNHAP", sqlClient.VarChar(100), username)
      .query(
        "SELECT IDNGUOIDUNG FROM NGUOIDUNG WHERE TENDANGNHAP = @TENDANGNHAP",
      );

    if (existingAdmin.recordset[0]) {
      console.log("⚠ Admin account already exists with username:", username);
      return;
    }

    // Create admin account
    const result = await pool
      .request()
      .input("TENDANGNHAP", sqlClient.VarChar(100), username)
      .input("MATKHAU", sqlClient.NVarChar(255), password)
      .input("HOTEN", sqlClient.NVarChar(100), fullName)
      .input("EMAIL", sqlClient.VarChar(100), email)
      .input("IDVAITRO", sqlClient.BigInt, adminRoleId)
      .input("TRANGTHAI", sqlClient.NVarChar(30), "Đang hoạt động").query(`
        DECLARE @SALT VARBINARY(16) = CRYPT_GEN_RANDOM(16);
        DECLARE @HASHEDPW VARBINARY(64) = HASHBYTES('SHA2_256', CONVERT(VARCHAR(MAX), @MATKHAU) + CONVERT(VARCHAR(MAX), @SALT));

        INSERT INTO NGUOIDUNG (TENDANGNHAP, MATKHAU, HOTEN, EMAIL, IDVAITRO, TRANGTHAI, SALT, NGAYTAO)
        VALUES (@TENDANGNHAP, @HASHEDPW, @HOTEN, @EMAIL, @IDVAITRO, @TRANGTHAI, @SALT, GETDATE());

        SELECT SCOPE_IDENTITY() AS IDNGUOIDUNG;
      `);

    console.log("✓ Admin account created successfully!\n");
    console.log("┌─ Admin Account Details ─────────────────┐");
    console.log(`│ Username: ${username.padEnd(32)} │`);
    console.log(`│ Password: ${password.padEnd(32)} │`);
    console.log(`│ Email:    ${email.padEnd(32)} │`);
    console.log("└──────────────────────────────────────────┘");
  } catch (error) {
    console.error("✗ Error creating admin account:", error.message);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log("\n✓ Database connection closed");
    }
  }
}

createAdmin();
