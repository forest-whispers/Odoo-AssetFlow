import Asset from "./asset.model.js";
import AssetCategory from "../assetCategory/assetCategory.model.js";
import Department from "../department/department.model.js";

import { createAuditLogService } from "../auditLog/auditLog.service.js";
import { buildSearchQuery } from "../../utils/search.js";

import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../../utils/error.js";


export const createAssetService = async (
    currUser,
    {
        assetTag,
        name,
        category,
        department,
        serialNumber,
        condition,
        location,
        purchaseDate,
        purchaseCost,
        warrantyExpiry,
        notes,
    },
) => {
    const normalizedAssetTag = assetTag
        .trim()
        .toUpperCase();

    const duplicateQueries = [
        {
            assetTag: normalizedAssetTag,
        },
    ];

    if (serialNumber) {
        duplicateQueries.push({
            serialNumber: serialNumber.trim(),
        });
    }

    const [
        existingAsset,
        assetCategory,
        departmentExists,
    ] = await Promise.all([
        Asset.findOne({
            $or: duplicateQueries,
        })
            .select("assetTag serialNumber")
            .lean(),

        AssetCategory.findById(category)
            .select("_id isActive")
            .lean(),

        department
            ? Department.findById(department)
                .select("_id isActive")
                .lean()
            : Promise.resolve(null),
    ]);

    if (existingAsset) {
        if (
            existingAsset.assetTag ===
            normalizedAssetTag
        ) {
            throw new ConflictError(
                "An asset with this asset tag already exists",
            );
        }

        if (
            serialNumber &&
            existingAsset.serialNumber ===
            serialNumber.trim()
        ) {
            throw new ConflictError(
                "An asset with this serial number already exists",
            );
        }
    }

    if (!assetCategory) {
        throw new NotFoundError(
            "Asset category not found",
        );
    }

    if (!assetCategory.isActive) {
        throw new BadRequestError(
            "Cannot register an asset under an inactive category",
        );
    }

    if (department) {
        if (!departmentExists) {
            throw new NotFoundError(
                "Department not found",
            );
        }

        if (!departmentExists.isActive) {
            throw new BadRequestError(
                "Cannot assign an asset to an inactive department",
            );
        }
    }

    const asset = await Asset.create({
        assetTag: normalizedAssetTag,
        name,
        category,
        department: department || null,
        serialNumber:
            serialNumber?.trim() || undefined,
        condition,
        location,
        purchaseDate,
        purchaseCost,
        warrantyExpiry,
        notes,
        createdBy: currUser.id,
    });

    await createAuditLogService(
        currUser.id,
        "asset_created",
        "asset",
        asset._id,
        {
            assetTag: asset.assetTag,
            name: asset.name,
            category: asset.category,
            department: asset.department,
        },
    );

    return asset;
};


export const getAssetsService = async (
    queryParams,
) => {
    const query = {};

    const page = Math.max(
        Number(queryParams.page) || 1,
        1,
    );

    const limit = Math.min(
        Math.max(
            Number(queryParams.limit) || 10,
            1,
        ),
        100,
    );

    const skip = (page - 1) * limit;

    if (queryParams.category) {
        query.category = queryParams.category;
    }

    if (queryParams.department) {
        query.department = queryParams.department;
    }

    if (
        queryParams.status &&
        [
            "available",
            "allocated",
            "maintenance",
            "retired",
        ].includes(queryParams.status)
    ) {
        query.status = queryParams.status;
    }

    if (
        queryParams.condition &&
        [
            "excellent",
            "good",
            "fair",
            "poor",
        ].includes(queryParams.condition)
    ) {
        query.condition = queryParams.condition;
    }

    if (queryParams.isActive !== undefined) {
        query.isActive =
            queryParams.isActive === "true";
    }

    Object.assign(
        query,
        buildSearchQuery(
            queryParams.search,
            [
                "assetTag",
                "name",
                "serialNumber",
                "location",
            ],
        ),
    );

    const allowedSortFields = [
        "createdAt",
        "name",
        "assetTag",
        "purchaseCost",
        "purchaseDate",
    ];

    const sortBy = allowedSortFields.includes(
        queryParams.sortBy,
    )
        ? queryParams.sortBy
        : "createdAt";

    const sortOrder =
        queryParams.order === "asc" ? 1 : -1;

    const [assets, totalAssets] =
        await Promise.all([
            Asset.find(query)
                .select(
                    "assetTag name category department serialNumber status condition location purchaseDate purchaseCost warrantyExpiry isActive createdAt",
                )
                .populate(
                    "category",
                    "name code",
                )
                .populate(
                    "department",
                    "name code",
                )
                .sort({
                    [sortBy]: sortOrder,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            Asset.countDocuments(query),
        ]);

    return {
        assets,

        pagination: {
            page,
            limit,
            total: totalAssets,
            totalPages: Math.ceil(
                totalAssets / limit,
            ),
        },
    };
};


export const getAssetService = async (
    assetId,
) => {
    const asset = await Asset.findById(assetId)
        .populate(
            "category",
            "name code description",
        )
        .populate(
            "department",
            "name code",
        )
        .populate(
            "createdBy",
            "name email role",
        )
        .lean();

    if (!asset) {
        throw new NotFoundError(
            "Asset not found",
        );
    }

    return asset;
};


export const updateAssetService = async (
    currUser,
    assetId,
    updatePayload,
) => {
    const asset = await Asset.findById(assetId);

    if (!asset) {
        throw new NotFoundError(
            "Asset not found",
        );
    }

    const allowedUpdates = [
        "name",
        "category",
        "department",
        "serialNumber",
        "condition",
        "location",
        "purchaseDate",
        "purchaseCost",
        "warrantyExpiry",
        "notes",
    ];

    const filteredPayload = {};

    allowedUpdates.forEach((field) => {
        if (updatePayload[field] !== undefined) {
            filteredPayload[field] =
                updatePayload[field];
        }
    });

    const categoryChanged =
        filteredPayload.category &&
        filteredPayload.category.toString() !==
        asset.category.toString();

    if (categoryChanged) {
        const category =
            await AssetCategory.findById(
                filteredPayload.category,
            )
                .select("_id isActive")
                .lean();

        if (!category) {
            throw new NotFoundError(
                "Asset category not found",
            );
        }

        if (!category.isActive) {
            throw new BadRequestError(
                "Cannot move asset to an inactive category",
            );
        }
    }

    if (filteredPayload.department) {
        const department =
            await Department.findById(
                filteredPayload.department,
            )
                .select("_id isActive")
                .lean();

        if (!department) {
            throw new NotFoundError(
                "Department not found",
            );
        }

        if (!department.isActive) {
            throw new BadRequestError(
                "Cannot move asset to an inactive department",
            );
        }
    }

    if (
        filteredPayload.serialNumber &&
        filteredPayload.serialNumber !==
        asset.serialNumber
    ) {
        const existingAsset =
            await Asset.findOne({
                serialNumber:
                    filteredPayload.serialNumber,
                _id: {
                    $ne: asset._id,
                },
            })
                .select("_id")
                .lean();

        if (existingAsset) {
            throw new ConflictError(
                "An asset with this serial number already exists",
            );
        }
    }

    const effectivePurchaseDate =
        filteredPayload.purchaseDate ??
        asset.purchaseDate;

    const effectiveWarrantyExpiry =
        filteredPayload.warrantyExpiry ??
        asset.warrantyExpiry;

    if (
        effectivePurchaseDate &&
        effectiveWarrantyExpiry &&
        new Date(effectiveWarrantyExpiry) <
        new Date(effectivePurchaseDate)
    ) {
        throw new BadRequestError(
            "Warranty expiry cannot be before purchase date",
        );
    }

    const previousValues = {};

    Object.keys(filteredPayload).forEach(
        (field) => {
            previousValues[field] = asset[field];
        },
    );

    Object.assign(asset, filteredPayload);

    await asset.save();

    await createAuditLogService(
        currUser.id,
        "asset_updated",
        "asset",
        asset._id,
        {
            assetTag: asset.assetTag,
            changedFields:
                Object.keys(filteredPayload),
            previousValues,
        },
    );

    return asset;
};

export const retireAssetService = async (
    currUser,
    assetId,
) => {
    const existingAsset = await Asset.findById(assetId)
        .select("assetTag status isActive")
        .lean();

    if (!existingAsset) {
        throw new NotFoundError("Asset not found");
    }

    if (existingAsset.status === "retired") {
        throw new BadRequestError(
            "Asset is already retired",
        );
    }

    if (existingAsset.status === "allocated") {
        throw new BadRequestError(
            "Allocated asset must be returned before retirement",
        );
    }

    if (existingAsset.status === "maintenance") {
        throw new BadRequestError(
            "Asset under maintenance cannot be retired until maintenance is resolved",
        );
    }

    const asset = await Asset.findOneAndUpdate(
        {
            _id: assetId,
            status: existingAsset.status,
            isActive: true,
        },
        {
            $set: {
                status: "retired",
                isActive: false,
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (!asset) {
        throw new ConflictError(
            "Asset status changed while processing the retirement request",
        );
    }

    await createAuditLogService(
        currUser.id,
        "asset_retired",
        "asset",
        asset._id,
        {
            assetTag: asset.assetTag,
            previousStatus: existingAsset.status,
        },
    );

    return asset;
};