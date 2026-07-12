import {
    createAssetCategoryService,
    getAssetCategoriesService,
    getAssetCategoryByIdService,
    updateAssetCategoryService,
} from "./assetCategory.service.js";

export const createAssetCategoryController = async (
    req,
    res,
    next,
) => {
    try {
        const category =
            await createAssetCategoryService(req.body);

        res.status(201).json({
            success: true,
            message:
                "Asset category created successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

export const getAssetCategoriesController = async (
    req,
    res,
    next,
) => {
    try {
        const categories =
            await getAssetCategoriesService(req.query);

        res.status(200).json({
            success: true,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
};

export const getAssetCategoryByIdController = async (
    req,
    res,
    next,
) => {
    try {
        const category =
            await getAssetCategoryByIdService(
                req.params.id,
            );

        res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
};

export const updateAssetCategoryController = async (
    req,
    res,
    next,
) => {
    try {
        const category =
            await updateAssetCategoryService(
                req.params.id,
                req.body,
            );

        res.status(200).json({
            success: true,
            message:
                "Asset category updated successfully",
            data: category,
        });
    } catch (error) {
        next(error);
    }
};