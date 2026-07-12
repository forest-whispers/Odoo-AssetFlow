import rateLimit from "express-rate-limit";

export const authRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: "Too many authentication attempts, try again later",
});

export const globalRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many requests, try again later",
});