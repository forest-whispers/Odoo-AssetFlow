import express from "express";

import {
    registerUserController,
    loginUserController,
    getUserController,
    getCurrentUserController,
    getUsersController,
    updateUserRoleController,
    logoutUserController,
} from "./user.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    registerSchema,
    loginSchema,
    updateUserRoleSchema,
} from "./user.validation.js";

import { authRateLimiter } from "../../middleware/rateLimiter.js";

const router = express.Router();

router.post(
    "/register",
    // authRateLimiter,
    validate(registerSchema),
    registerUserController,
);

router.post(
    "/login",
    // authRateLimiter,
    validate(loginSchema),
    loginUserController,
);

router.get(
    "/logout",
    requireAuth,
    logoutUserController,
);

router.get(
    "/me",
    requireAuth,
    getCurrentUserController,
);

router.get(
    "/",
    requireAuth,
    requireRole("admin", "asset_manager", "department_head"),
    getUsersController,
);

router.patch(
    "/:id/role",
    requireAuth,
    requireRole("admin"),
    validate(updateUserRoleSchema),
    updateUserRoleController,
);

router.get(
    "/:id",
    requireAuth,
    requireRole("admin"),
    getUserController,
);

export default router;