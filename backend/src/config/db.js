const sqlStandard = require("mssql");
const defaultAuthMode = String(process.env.DB_AUTH_MODE || "sql").toLowerCase();

function resolveSqlClient(authMode) {
  if (authMode !== "windows") {
    return sqlStandard;
  }

  return require("mssql/msnodesqlv8");
}

const activeSqlClient = sqlStandard;

let pool;
let dbUnavailable = false;

function createUnavailablePool() {
  const err = Object.assign(
    new Error("Database unavailable (connect failed)"),
    {
      statusCode: 503,
    },
  );

  const requestBuilder = () => ({
    input() {
      return this;
    },
    query() {
      return Promise.reject(err);
    },
    execute() {
      return Promise.reject(err);
    },
  });

  return {
    request: requestBuilder,
  };
}

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

function getDbConfig() {
  const rawServer = process.env.DB_SERVER || "";
  const { server, instanceName } = parseServerAndInstance(rawServer);
  const authMode = String(process.env.DB_AUTH_MODE || "sql").toLowerCase();

  if (authMode === "windows") {
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

    return {
      connectionString: connectionParts.join(";") + ";",
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }

  // For SQL authentication, use the raw server value for proper LocalDB support
  return {
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

async function getPool() {
  if (pool) {
    return pool;
  }

  const authMode = String(process.env.DB_AUTH_MODE || "sql").toLowerCase();
  let sqlClient;

  try {
    sqlClient = resolveSqlClient(authMode);
  } catch (err) {
    console.error(
      "[DB_ERROR] Failed to load Windows SQL driver (msnodesqlv8):",
      err.message,
    );
    dbUnavailable = true;
    pool = createUnavailablePool();
    return pool;
  }

  // If previous attempts determined DB is unavailable, return the unavailable pool.
  if (dbUnavailable) {
    pool = createUnavailablePool();
    return pool;
  }

  // Add a short timeout to avoid hanging startup if DB is unreachable.
  console.log(
    `[DB_INFO] Attempting ${authMode} authentication to ${process.env.DB_SERVER}`,
  );
  const connectPromise = sqlClient.connect(getDbConfig());
  const timeoutMs = Number(process.env.DB_CONNECT_TIMEOUT_MS || 5000);
  let timeoutHandle;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutHandle = setTimeout(
      () => reject(new Error("DB connection timeout")),
      timeoutMs,
    );
  });

  try {
    pool = await Promise.race([connectPromise, timeoutPromise]);
    console.log("[DB_INFO] Successfully connected to database");
    return pool;
  } catch (err) {
    console.error("[DB_ERROR] Connection failed:", err.message, err.code);
    if (err.originalError) {
      console.error("[DB_ERROR] Original error:", err.originalError.message);
    }

   
    dbUnavailable = true;
    pool = createUnavailablePool();
    return pool;
  } finally {
    clearTimeout(timeoutHandle);
  }
}

module.exports = {
  sql: activeSqlClient,
  getPool,
};
