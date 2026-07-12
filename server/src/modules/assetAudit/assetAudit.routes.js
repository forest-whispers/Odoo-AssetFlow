import express from "express";

import {
    createAssetAuditController,
    getAssetAuditsController,
    getAssetAuditByIdController,
    startAssetAuditController,
    verifyAuditItemController,
    completeAssetAuditController,
} from "./assetAudit.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    createAssetAuditSchema,
    updateAuditItemSchema,
} from "./assetAudit.validation.js";

const router = express.Router();

router.use(requireAuth);

router.post(
    "/",
    requireRole("admin", "asset_manager"),
    validate(createAssetAuditSchema),
    createAssetAuditController,
);

router.get(
    "/",
    requireRole(
        "admin",
        "asset_manager",
        "department_head",
    ),
    getAssetAuditsController,
);

router.get(
    "/:id",
    requireRole(
        "admin",
        "asset_manager",
        "department_head",
    ),
    getAssetAuditByIdController,
);

router.patch(
    "/:id/start",
    requireRole("admin", "asset_manager"),
    startAssetAuditController,
);

router.patch(
    "/:id/items/:itemId",
    requireRole(
        "admin",
        "asset_manager",
        "department_head",
    ),
    validate(updateAuditItemSchema),
    verifyAuditItemController,
);

router.patch(
    "/:id/complete",
    requireRole("admin", "asset_manager"),
    completeAssetAuditController,
);

export default router;