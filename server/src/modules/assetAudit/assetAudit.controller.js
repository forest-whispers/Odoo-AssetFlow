import {
    createAssetAuditService,
    getAssetAuditsService,
    getAssetAuditByIdService,
    startAssetAuditService,
    verifyAuditItemService,
    completeAssetAuditService,
} from "./assetAudit.service.js";


export const createAssetAuditController = async (
    req,
    res,
    next,
) => {
    try {
        const audit =
            await createAssetAuditService(
                req.body,
                req.user,
            );

        res.status(201).json({
            success: true,
            message:
                "Asset audit created successfully",
            data: audit,
        });
    } catch (error) {
        next(error);
    }
};


export const getAssetAuditsController = async (
    req,
    res,
    next,
) => {
    try {
        const result =
            await getAssetAuditsService(
                req.query,
                req.user,
            );

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};


export const getAssetAuditByIdController = async (
    req,
    res,
    next,
) => {
    try {
        const audit =
            await getAssetAuditByIdService(
                req.params.id,
                req.user,
            );

        res.status(200).json({
            success: true,
            data: audit,
        });
    } catch (error) {
        next(error);
    }
};


export const startAssetAuditController = async (
    req,
    res,
    next,
) => {
    try {
        const audit =
            await startAssetAuditService(
                req.params.id,
                req.user
            );

        res.status(200).json({
            success: true,
            message:
                "Asset audit started successfully",
            data: audit,
        });
    } catch (error) {
        next(error);
    }
};


export const verifyAuditItemController = async (
    req,
    res,
    next,
) => {
    try {
        const item =
            await verifyAuditItemService(
                req.params.id,
                req.params.itemId,
                req.body,
                req.user,
            );

        res.status(200).json({
            success: true,
            message:
                "Asset verification updated successfully",
            data: item,
        });
    } catch (error) {
        next(error);
    }
};


export const completeAssetAuditController = async (
    req,
    res,
    next,
) => {
    try {
        const result =
            await completeAssetAuditService(
                req.params.id,
                req.user
            );

        res.status(200).json({
            success: true,
            message:
                "Asset audit completed successfully",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};