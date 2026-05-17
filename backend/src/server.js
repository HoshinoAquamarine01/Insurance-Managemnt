const app = require("./app");
const { getPool } = require("./config/db");

const port = Number(process.env.PORT || 5000);

// Catch all unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("[FATAL] Unhandled Promise Rejection:", reason);
  console.error("[FATAL] Promise:", promise);
});

process.on("uncaughtException", (error) => {
  console.error("[FATAL] Uncaught Exception:", error);
  console.error("[FATAL] Stack:", error.stack);
  console.error("[FATAL] Attempting to continue running...");
});

process.on("exit", (code) => {
  console.error(`[PROCESS_EXIT] Node.js process exiting with code ${code}`);
});

async function startServer() {
  try {
    console.log("[SERVER] Initializing database pool...");
    const pool = await getPool();
    console.log("[SERVER] Database pool initialized successfully");
  } catch (error) {
    console.error("[SERVER] DB pool initialization failed:", error.message);
    console.error(
      "[SERVER] Continuing to start HTTP server without DB connection. Some endpoints may fail.",
    );
  }

  const server = app.listen(port, () => {
    console.log(`[SERVER] Server listening on port ${port}`);
  });

  server.on("error", (err) => {
    console.error("[SERVER] HTTP Server error:", err.message);
    if (err.code === "EADDRINUSE") {
      console.error(
        `[SERVER] Port ${port} is already in use. Please stop the other process or use a different port.`,
      );
      process.exit(1);
    }
    console.error("[SERVER] Full error:", err);
  });

  server.on("close", () => {
    console.log("[SERVER] HTTP Server closed");
  });

  return server;
}

const serverPromise = startServer().catch((err) => {
  console.error("[SERVER_ERROR] Failed to start server:", err);
});
