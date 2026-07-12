import express from "express";

import {
    createResourceController,
    getResourcesController,
    createBookingController,
    getBookingsController,
    getBookingController,
    cancelBookingController,
    completeBookingController,
} from "./resourceBooking.controller.js";

import requireAuth from "../../middleware/requireAuth.js";
import requireRole from "../../middleware/requireRole.js";
import { validate } from "../../middleware/validate.js";

import {
    createResourceSchema,
    createBookingSchema,
    cancelBookingSchema,
} from "./resourceBooking.validation.js";


const router = express.Router();


router.post(
    "/resources",
    requireAuth,
    requireRole("admin", "asset_manager"),
    validate(createResourceSchema),
    createResourceController,
);


router.get(
    "/resources",
    requireAuth,
    getResourcesController,
);


router.post(
    "/bookings",
    requireAuth,
    validate(createBookingSchema),
    createBookingController,
);


router.get(
    "/bookings",
    requireAuth,
    getBookingsController,
);


router.get(
    "/bookings/:id",
    requireAuth,
    getBookingController,
);


router.patch(
    "/bookings/:id/cancel",
    requireAuth,
    validate(cancelBookingSchema),
    cancelBookingController,
);


router.patch(
    "/bookings/:id/complete",
    requireAuth,
    requireRole("admin", "asset_manager"),
    completeBookingController,
);


export default router;