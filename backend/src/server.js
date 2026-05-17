require("dotenv").config();

const app = require("./app");
const { connectDB } = require("./config/mssql");

const port = Number(process.env.PORT || 5000);

process.on("unhandledRejection", (reason) => {
  console.error("[LỖI] Promise bị reject không được xử lý:", reason);
  process.exit(1);
});

process.on("uncaughtException", (error) => {
  console.error("[LỖI] Exception không được bắt:", error);
  process.exit(1);
});

connectDB()
  .then(() => {
    const server = app.listen(port, () => {
      console.log(`[SERVER] Đang lắng nghe tại cổng ${port}`);
    });
    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(
          `[SERVER] Cổng ${port} đang được sử dụng, vui lòng dùng cổng khác`,
        );
      } else {
        console.error("[SERVER] Lỗi HTTP server:", err.message);
      }
      process.exit(1);
    });

    server.on("close", () => console.log("[SERVER] HTTP server đã đóng"));
    process.on("SIGTERM", () => server.close(() => process.exit(0)));
    process.on("SIGINT", () => server.close(() => process.exit(0)));
  })
  .catch((err) => {
    console.error(
      "[DATABASE] Kết nối thất bại, một số endpoint có thể không hoạt động:",
      err.message,
    );
  });
