import express from "express";

import {
    getDashboardController,
} from "./dashboard.controller.js";

import requireAuth from "../../middleware/requireAuth.js";

const router = express.Router();

router.get(
    "/",
    requireAuth,
    getDashboardController,
);

export default router;