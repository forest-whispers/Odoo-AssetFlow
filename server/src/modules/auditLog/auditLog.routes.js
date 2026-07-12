import express from "express";
const router = express.Router();

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { getAuditLogsController } from './auditLog.controller.js';

router.get( "/", requireAuth, requireRole("admin"), getAuditLogsController,);

export default router;