import Notification from "./notification.model.js";
import User from "../user/user.model.js";
import { NotFoundError } from "../../utils/error.js";

/**
 * Creates a notification for a single recipient.
 */
export const createNotificationService = async ({
    recipient,
    type,
    title,
    message,
    entityType,
    entityId,
}) => {
    try {
        const notification = await Notification.create({
            recipient,
            type,
            title,
            message,
            entityType: entityType || null,
            entityId: entityId || null,
        });
        return notification;
    } catch (error) {
        // Safe logger wrapper to prevent secondary notification failure from blocking primary txn
        console.error("Secondary notification creation failed:", error);
        return null;
    }
};

/**
 * Notifies multiple roles by querying active users with those roles.
 */
export const notifyRolesService = async ({
    roles,
    type,
    title,
    message,
    entityType,
    entityId,
}) => {
    try {
        if (!roles || !roles.length) return [];

        const users = await User.find({
            role: { $in: roles },
            isActive: true,
        })
            .select("_id")
            .lean();

        if (!users || users.length === 0) return [];

        const notificationsData = users.map((u) => ({
            recipient: u._id,
            type,
            title,
            message,
            entityType: entityType || null,
            entityId: entityId || null,
        }));

        const result = await Notification.insertMany(notificationsData, {
            ordered: false,
        });
        return result;
    } catch (error) {
        console.error("Bulk role notifications creation failed:", error);
        return [];
    }
};

/**
 * Retrieves paginated notifications matching recipient.
 * Supports comma-separated type filtering.
 */
export const getNotificationsService = async (recipientId, queryParams) => {
    const query = { recipient: recipientId };

    const page = Math.max(Number(queryParams.page) || 1, 1);
    const limit = Math.min(Math.max(Number(queryParams.limit) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const allowedTypes = [
        "alert",
        "approval",
        "booking",
        "allocation",
        "transfer",
        "maintenance",
        "audit",
    ];

    if (queryParams.type) {
        const requestedTypes = queryParams.type
            .split(",")
            .map((t) => t.trim())
            .filter((t) => allowedTypes.includes(t));

        if (requestedTypes.length > 0) {
            query.type = { $in: requestedTypes };
        }
    }

    const [notifications, total] = await Promise.all([
        Notification.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),
        Notification.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        notifications,
        pagination: {
            page,
            limit,
            total,
            totalPages,
        },
    };
};

/**
 * Retrieves the count of unread notifications for a recipient.
 */
export const getUnreadCountService = async (recipientId) => {
    const count = await Notification.countDocuments({
        recipient: recipientId,
        isRead: false,
    });
    return { count };
};

/**
 * Marks a specific notification as read, ensuring ownership validation.
 */
export const markNotificationReadService = async (notificationId, recipientId) => {
    const notification = await Notification.findOneAndUpdate(
        {
            _id: notificationId,
            recipient: recipientId,
        },
        {
            $set: { isRead: true },
        },
        {
            new: true,
        },
    );

    if (!notification) {
        throw new NotFoundError(
            "Notification not found or access unauthorized",
        );
    }

    return notification;
};

/**
 * Marks all notifications for a recipient as read.
 */
export const markAllNotificationsReadService = async (recipientId) => {
    const result = await Notification.updateMany(
        {
            recipient: recipientId,
            isRead: false,
        },
        {
            $set: { isRead: true },
        },
    );
    return { modifiedCount: result.modifiedCount };
};
