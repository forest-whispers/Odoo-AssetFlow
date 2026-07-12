import {
    createMaintenanceService,
    getMaintenanceRequestsService,
    getMaintenanceRequestService,
    approveMaintenanceService,
    rejectMaintenanceService,
    resolveMaintenanceService,
} from "./maintenance.service.js";


export const createMaintenanceController = async (
    req,
    res,
    next,
) => {
    try {
        const maintenance =
            await createMaintenanceService(
                req.user,
                req.body,
            );

        res.status(201).json({
            success: true,
            message:
                "Maintenance request created successfully",
            data: {
                _id: maintenance._id,
                asset: maintenance.asset,
                status: maintenance.status,
                priority: maintenance.priority,
            },
        });
    } catch (error) {
        next(error);
    }
};


export const getMaintenanceRequestsController = async (
    req,
    res,
    next,
) => {
    try {
        const requests =
            await getMaintenanceRequestsService(
                req.user,
                req.query,
            );

        res.status(200).json({
            success: true,
            data: requests,
        });
    } catch (error) {
        next(error);
    }
};


export const getMaintenanceRequestController = async (
    req,
    res,
    next,
) => {
    try {
        const maintenance =
            await getMaintenanceRequestService(
                req.user,
                req.params.id,
            );

        res.status(200).json({
            success: true,
            data: maintenance,
        });
    } catch (error) {
        next(error);
    }
};


export const approveMaintenanceController = async (
    req,
    res,
    next,
) => {
    try {
        const maintenance =
            await approveMaintenanceService(
                req.user,
                req.params.id,
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance request approved successfully",
            data: maintenance,
        });
    } catch (error) {
        next(error);
    }
};


export const rejectMaintenanceController = async (
    req,
    res,
    next,
) => {
    try {
        const maintenance =
            await rejectMaintenanceService(
                req.user,
                req.params.id,
                req.body,
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance request rejected successfully",
            data: maintenance,
        });
    } catch (error) {
        next(error);
    }
};


export const resolveMaintenanceController = async (
    req,
    res,
    next,
) => {
    try {
        const result =
            await resolveMaintenanceService(
                req.user,
                req.params.id,
                req.body,
            );

        res.status(200).json({
            success: true,
            message:
                "Maintenance resolved successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};