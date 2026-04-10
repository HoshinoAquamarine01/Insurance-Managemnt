const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const env = require("./config/env");
const { connectMongo } = require("./db/mongoose");

const authRoutes = require("./routes/authRoutes");
const insuredRoutes = require("./routes/insuredRoutes");
const contractRoutes = require("./routes/contractRoutes");
const meRoutes = require("./routes/meRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/insured-persons", insuredRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/me", meRoutes);
app.use("/api/admin", adminRoutes);

app.use((err, req, res, next) => {
  if (err?.name === "ValidationError") {
    return res.status(400).json({ message: err.message });
  }

  return res.status(500).json({ message: "Internal Server Error" });
});

module.exports = app;

async function bootstrap() {
  try {
    await connectMongo();
    app.listen(env.port, () => {
      console.log(`Server is running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  bootstrap();
}
