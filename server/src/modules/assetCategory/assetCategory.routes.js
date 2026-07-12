import express from "express";

import {
    createAssetCategoryController,
    getAssetCategoriesController,
    getAssetCategoryByIdController,
    updateAssetCategoryController,
} from "./assetCategory.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    createAssetCategorySchema,
    updateAssetCategorySchema,
} from "./assetCategory.validation.js";

const router = express.Router();

router.get(
    "/",
    requireAuth,
    getAssetCategoriesController,
);

router.get(
    "/:id",
    requireAuth,
    getAssetCategoryByIdController,
);

router.post(
    "/",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(createAssetCategorySchema),
    createAssetCategoryController,
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(updateAssetCategorySchema),
    updateAssetCategoryController,
);

export default router;