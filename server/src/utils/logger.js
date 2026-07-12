import winston from "winston";
const { combine, timestamp, printf } = winston.format;

const customformat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

const logger = winston.createLogger({
    level: "info",
    format: combine(
        timestamp(),
        customformat,
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

export default logger;