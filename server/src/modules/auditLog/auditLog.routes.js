import express from "express";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import {
    getAuditLogsController,
} from "./auditLog.controller.js";

const router = express.Router();

router.get(
    "/",
    requireAuth,
    requireRole("admin", "asset_manager"),
    getAuditLogsController,
);

export default router;