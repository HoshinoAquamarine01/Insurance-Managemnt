function validateEnv() {
  const authMode = String(process.env.DB_AUTH_MODE || "sql").toLowerCase();
  const baseRequiredVars = ["DB_SERVER", "DB_NAME"];
  const sqlAuthRequiredVars = ["DB_USER", "DB_PASSWORD"];
  const requiredVars =
    authMode === "windows"
      ? baseRequiredVars
      : [...baseRequiredVars, ...sqlAuthRequiredVars];

  const missing = requiredVars.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
  }
}

module.exports = {
  validateEnv,
};
