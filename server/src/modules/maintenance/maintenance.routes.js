import express from "express";

import {
    createMaintenanceController,
    getMaintenanceRequestsController,
    getMaintenanceRequestController,
    approveMaintenanceController,
    rejectMaintenanceController,
    resolveMaintenanceController,
} from "./maintenance.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    createMaintenanceSchema,
    rejectMaintenanceSchema,
    resolveMaintenanceSchema,
} from "./maintenance.validation.js";


const router = express.Router();

router.post(
    "/",
    requireAuth,
    validate(createMaintenanceSchema),
    createMaintenanceController,
);


router.get(
    "/",
    requireAuth,
    getMaintenanceRequestsController,
);


router.get(
    "/:id",
    requireAuth,
    getMaintenanceRequestController,
);


router.patch(
    "/:id/approve",
    requireAuth,
    requireRole("admin", "asset_manager"),
    approveMaintenanceController,
);


router.patch(
    "/:id/reject",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(rejectMaintenanceSchema),
    rejectMaintenanceController,
);


router.patch(
    "/:id/resolve",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(resolveMaintenanceSchema),
    resolveMaintenanceController,
);


export default router;