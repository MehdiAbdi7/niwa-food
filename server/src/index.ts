import "dotenv/config";
import { createServer } from "http";
import app from "./app.js";
import { logger } from "./config/logger.js";
import { connectDB } from "./config/db.js";
import { initSocket } from "./config/socket.js";

const PORT = process.env.PORT || 5000;

const server = createServer(app);
initSocket(server);

await connectDB().then(() => {
  server.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`Server is running on http://localhost:${PORT}`);
  });
});
