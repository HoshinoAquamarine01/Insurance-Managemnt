import "dotenv/config";

const app = require("./src/server");
const env = require("./src/config/env");
const { connectMongo } = require("./src/db/mongoose");

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

bootstrap();
