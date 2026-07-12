import {
    createAssetService,
    getAssetsService,
    getAssetService,
    updateAssetService,
    retireAssetService,
} from "./asset.service.js";


export const createAssetController = async (
    req,
    res,
    next,
) => {
    try {
        const asset = await createAssetService(
            req.user,
            req.body,
        );

        res.status(201).json({
            success: true,
            message: "Asset registered successfully",
            data: {
                _id: asset._id,
                assetTag: asset.assetTag,
            },
        });
    } catch (error) {
        next(error);
    }
};


export const getAssetsController = async (
    req,
    res,
    next,
) => {
    try {
        const assets =
            await getAssetsService(req.query);

        res.status(200).json({
            success: true,
            data: assets,
        });
    } catch (error) {
        next(error);
    }
};


export const getAssetController = async (
    req,
    res,
    next,
) => {
    try {
        const asset = await getAssetService(
            req.params.id,
        );

        res.status(200).json({
            success: true,
            data: asset,
        });
    } catch (error) {
        next(error);
    }
};


export const updateAssetController = async (
    req,
    res,
    next,
) => {
    try {
        const asset = await updateAssetService(
            req.user,
            req.params.id,
            req.body,
        );

        res.status(200).json({
            success: true,
            message: "Asset updated successfully",
            data: asset,
        });
    } catch (error) {
        next(error);
    }
};


export const retireAssetController = async (
    req,
    res,
    next,
) => {
    try {
        const asset = await retireAssetService(
            req.user,
            req.params.id,
        );

        res.status(200).json({
            success: true,
            message: "Asset retired successfully",
            data: {
                _id: asset._id,
                assetTag: asset.assetTag,
                status: asset.status,
            },
        });
    } catch (error) {
        next(error);
    }
};