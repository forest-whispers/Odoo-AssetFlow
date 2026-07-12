import {
    getAnalyticsService,
} from "./analytics.service.js";

export const getAnalyticsController = async (
    req,
    res,
    next,
) => {
    try {
        const analytics = await getAnalyticsService(
            req.user,
            req.query,
        );

        res.status(200).json({
            success: true,
            data: analytics,
        });
    } catch (error) {
        next(error);
    }
};