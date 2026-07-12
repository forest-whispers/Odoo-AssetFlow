import "./config/env.js";

import http from "http";

import app from "./app.js";
import connectDB from "./config/db.js";
// import { initSocket } from "./socket/socket.js";
import logger from "./utils/logger.js";

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

process.on("uncaughtException", (err) => {
    logger.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

process.on("unhandledRejection", (err) => {
    logger.error(`Unhandled Rejection: ${err.message}`);
    process.exit(1);
});

connectDB()
    .then(() => {
        logger.info("Successfully connected to MongoDB");

        server.listen(PORT, () => {
            logger.info(`Server started on port ${PORT}`);
        });
    })
    .catch((err) => {
        logger.error(`Database connection failed: ${err.message}`);
        process.exit(1);
    });

// Temporarily disabled during initial AssetFlow development.
// initSocket(server);