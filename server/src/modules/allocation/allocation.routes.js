import express from "express";

import {
    createAllocationController,
    getAllocationsController,
    getAllocationController,
    returnAssetController,
    transferAssetController,
} from "./allocation.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    createAllocationSchema,
    returnAssetSchema,
    transferAssetSchema,
} from "./allocation.validation.js";


const router = express.Router();


router.post(
    "/",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(createAllocationSchema),
    createAllocationController,
);


router.get(
    "/",
    requireAuth,
    requireRole(
        "admin",
        "asset_manager",
        "department_head",
    ),
    getAllocationsController,
);


router.get(
    "/:id",
    requireAuth,
    requireRole(
        "admin",
        "asset_manager",
        "department_head",
    ),
    getAllocationController,
);


router.patch(
    "/:id/return",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(returnAssetSchema),
    returnAssetController,
);


router.post(
    "/:id/transfer",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(transferAssetSchema),
    transferAssetController,
);


export default router;