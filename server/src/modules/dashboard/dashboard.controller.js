import {
    getDashboardService,
} from "./dashboard.service.js";

export const getDashboardController = async (
    req,
    res,
    next,
) => {
    try {
        const dashboard = await getDashboardService(
            req.user,
        );

        res.status(200).json({
            success: true,
            data: dashboard,
        });
    } catch (error) {
        next(error);
    }
};