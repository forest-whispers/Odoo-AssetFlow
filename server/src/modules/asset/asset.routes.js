import express from "express";

import {
    createAssetController,
    getAssetsController,
    getAssetController,
    updateAssetController,
    retireAssetController,
} from "./asset.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";

import {
    validate,
} from "../../middleware/validate.js";

import {
    createAssetSchema,
    updateAssetSchema,
} from "./asset.validation.js";


const router = express.Router();


router.post(
    "/",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(createAssetSchema),
    createAssetController,
);


router.get(
    "/",
    requireAuth,
    getAssetsController,
);


router.get(
    "/:id",
    requireAuth,
    getAssetController,
);


router.patch(
    "/:id",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(updateAssetSchema),
    updateAssetController,
);


router.patch(
    "/:id/retire",
    requireAuth,
    requireRole("admin", "asset_manager"),
    retireAssetController,
);


export default router;