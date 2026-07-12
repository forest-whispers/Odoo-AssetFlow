import express from "express";

import {
    createDepartmentController,
    getDepartmentsController,
    getDepartmentByIdController,
    updateDepartmentController,
} from "./department.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    createDepartmentSchema,
    updateDepartmentSchema,
} from "./department.validation.js";

const router = express.Router();

router.get(
    "/",
    requireAuth,
    getDepartmentsController,
);

router.get(
    "/:id",
    requireAuth,
    getDepartmentByIdController,
);

router.post(
    "/",
    requireAuth,
    requireRole("admin"),
    validate(createDepartmentSchema),
    createDepartmentController,
);

router.patch(
    "/:id",
    requireAuth,
    requireRole("admin"),
    validate(updateDepartmentSchema),
    updateDepartmentController,
);

export default router;