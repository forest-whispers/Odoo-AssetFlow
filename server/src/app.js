import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import { globalRateLimiter } from "./middleware/rateLimiter.js";
import errorHandler from "./utils/error.js";
import indexRouter from "./routes/index.js";

const app = express();

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",")
    : ["http://localhost:5173"];

// app.use(globalRateLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
    }),
);

app.use(helmet());
app.use(morgan("dev"));

app.get("/", (req, res) => {
    res.send("AssetFlow API Running");
});

app.use("/api", indexRouter);

app.use(errorHandler);

export default app;