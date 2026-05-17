require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const routes = require("./routes");
const { validateEnv } = require("./config/env");
const { notFoundHandler, errorHandler } = require("./middlewares/errorHandler");

validateEnv();

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan("dev"));

// Debug: Log all incoming requests
// Debug: Verbose request logging (temporary)
app.use((req, res, next) => {
  try {
    console.log(
      `[REQUEST] ${req.method} ${req.originalUrl}`,
      `- Headers: x-role=${req.headers["x-role"] || "(none)"}, x-user-id=${req.headers["x-user-id"] || "(none)"}`,
    );
  } catch (err) {
    // avoid logging errors from malformed headers
  }
  next();
});

// Support SePay callback URLs without /api prefix.
app.get("/payment/success", (req, res) => {
  const query = new URLSearchParams(req.query || {}).toString();
  return res.redirect(`/api/payments/success${query ? `?${query}` : ""}`);
});

app.get("/payment/error", (req, res) => {
  const query = new URLSearchParams(req.query || {}).toString();
  return res.redirect(`/api/payments/error${query ? `?${query}` : ""}`);
});

app.get("/payment/cancel", (req, res) => {
  const query = new URLSearchParams(req.query || {}).toString();
  return res.redirect(`/api/payments/cancel${query ? `?${query}` : ""}`);
});

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
