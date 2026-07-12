import {
    createAllocationService,
    getAllocationsService,
    getAllocationService,
    returnAssetService,
    transferAssetService,
} from "./allocation.service.js";


export const createAllocationController = async (
    req,
    res,
    next,
) => {
    try {
        const allocation =
            await createAllocationService(
                req.user,
                req.body,
            );

        res.status(201).json({
            success: true,
            message:
                "Asset allocated successfully",
            data: {
                _id: allocation._id,
                asset: allocation.asset,
                employee: allocation.employee,
                status: allocation.status,
            },
        });
    } catch (error) {
        next(error);
    }
};


export const getAllocationsController = async (
    req,
    res,
    next,
) => {
    try {
        const allocations =
            await getAllocationsService(req.query);

        res.status(200).json({
            success: true,
            data: allocations,
        });
    } catch (error) {
        next(error);
    }
};


export const getAllocationController = async (
    req,
    res,
    next,
) => {
    try {
        const allocation =
            await getAllocationService(
                req.params.id,
            );

        res.status(200).json({
            success: true,
            data: allocation,
        });
    } catch (error) {
        next(error);
    }
};


export const returnAssetController = async (
    req,
    res,
    next,
) => {
    try {
        const result = await returnAssetService(
            req.user,
            req.params.id,
            req.body,
        );

        res.status(200).json({
            success: true,
            message:
                "Asset returned successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};


export const transferAssetController = async (
    req,
    res,
    next,
) => {
    try {
        const allocation =
            await transferAssetService(
                req.user,
                req.params.id,
                req.body,
            );

        res.status(201).json({
            success: true,
            message:
                "Asset transferred successfully",
            data: {
                _id: allocation._id,
                asset: allocation.asset,
                employee: allocation.employee,
                department:
                    allocation.department,
                status: allocation.status,
            },
        });
    } catch (error) {
        next(error);
    }
};