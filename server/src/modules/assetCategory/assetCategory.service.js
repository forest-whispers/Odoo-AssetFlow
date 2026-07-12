import AssetCategory from "./assetCategory.model.js";

import {
    ConflictError,
    NotFoundError,
} from "../../utils/error.js";

const escapeRegex = (value) => {
    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&",
    );
};

export const createAssetCategoryService = async ({
    name,
    code,
    description,
}) => {
    const normalizedName = name.trim();
    const normalizedCode = code
        .trim()
        .toUpperCase();

    const existingCategory =
        await AssetCategory.findOne({
            $or: [
                {
                    name: {
                        $regex: `^${escapeRegex(
                            normalizedName,
                        )}$`,
                        $options: "i",
                    },
                },
                {
                    code: normalizedCode,
                },
            ],
        });

    if (existingCategory) {
        if (
            existingCategory.name.toLowerCase() ===
            normalizedName.toLowerCase()
        ) {
            throw new ConflictError(
                "Asset category with this name already exists",
            );
        }

        throw new ConflictError(
            "Asset category with this code already exists",
        );
    }

    const category = await AssetCategory.create({
        name: normalizedName,
        code: normalizedCode,
        description: description || null,
    });

    return category;
};

export const getAssetCategoriesService = async (
    queryParams,
) => {
    const query = {};

    if (queryParams.isActive !== undefined) {
        query.isActive =
            queryParams.isActive === "true";
    }

    if (queryParams.search) {
        const search = escapeRegex(
            queryParams.search.trim(),
        );

        query.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                code: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    const categories = await AssetCategory.find(query)
        .sort({ name: 1 })
        .lean();

    return categories;
};

export const getAssetCategoryByIdService = async (
    id,
) => {
    const category =
        await AssetCategory.findById(id).lean();

    if (!category) {
        throw new NotFoundError(
            "Asset category not found",
        );
    }

    return category;
};

export const updateAssetCategoryService = async (
    id,
    updates,
) => {
    const category =
        await AssetCategory.findById(id);

    if (!category) {
        throw new NotFoundError(
            "Asset category not found",
        );
    }

    if (updates.name !== undefined) {
        const normalizedName = updates.name.trim();

        const existingCategory =
            await AssetCategory.findOne({
                _id: { $ne: id },

                name: {
                    $regex: `^${escapeRegex(
                        normalizedName,
                    )}$`,
                    $options: "i",
                },
            });

        if (existingCategory) {
            throw new ConflictError(
                "Asset category with this name already exists",
            );
        }

        category.name = normalizedName;
    }

    if (updates.code !== undefined) {
        const normalizedCode = updates.code
            .trim()
            .toUpperCase();

        const existingCategory =
            await AssetCategory.findOne({
                _id: { $ne: id },
                code: normalizedCode,
            });

        if (existingCategory) {
            throw new ConflictError(
                "Asset category with this code already exists",
            );
        }

        category.code = normalizedCode;
    }

    if (updates.description !== undefined) {
        category.description =
            updates.description || null;
    }

    if (updates.isActive !== undefined) {
        category.isActive = updates.isActive;
    }

    await category.save();

    return category;
};