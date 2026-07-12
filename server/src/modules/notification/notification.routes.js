import express from "express";
import requireAuth from "../../middleware/requireAuth.js";
import {
    getNotificationsController,
    getUnreadCountController,
    markNotificationReadController,
    markAllNotificationsReadController,
} from "./notification.controller.js";

const router = express.Router();

// Define routes with correct registration order to prevent route parameter collision
router.get("/", requireAuth, getNotificationsController);
router.get("/unread-count", requireAuth, getUnreadCountController);
router.patch("/read-all", requireAuth, markAllNotificationsReadController);
router.patch("/:id/read", requireAuth, markNotificationReadController);

export default router;
