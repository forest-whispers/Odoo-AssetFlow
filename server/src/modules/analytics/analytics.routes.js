import express from "express";

import {
    getAnalyticsController,
} from "./analytics.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";

const router = express.Router();

router.get(
    "/",
    requireAuth,
    requireRole(
        "admin",
        "asset_manager",
        "department_head",
    ),
    getAnalyticsController,
);

export default router;