import {
    getNotificationsService,
    getUnreadCountService,
    markNotificationReadService,
    markAllNotificationsReadService,
} from "./notification.service.js";

export const getNotificationsController = async (req, res, next) => {
    try {
        const result = await getNotificationsService(req.user.id, req.query);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const getUnreadCountController = async (req, res, next) => {
    try {
        const result = await getUnreadCountService(req.user.id);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const markNotificationReadController = async (req, res, next) => {
    try {
        const notificationId = req.params.id;
        const result = await markNotificationReadService(notificationId, req.user.id);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

export const markAllNotificationsReadController = async (req, res, next) => {
    try {
        const result = await markAllNotificationsReadService(req.user.id);
        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};
