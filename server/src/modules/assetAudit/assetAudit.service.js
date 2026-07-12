import mongoose from "mongoose";

import AssetAudit from "./assetAudit.model.js";
import AssetAuditItem from "./assetAuditItem.model.js";

import Asset from "../asset/asset.model.js";
import Department from "../department/department.model.js";
import User from "../user/user.model.js";

import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/error.js";


export const createAssetAuditService = async (
    payload,
    currUser,
) => {
    const {
        name,
        department,
        auditors = [],
        startDate,
        endDate,
    } = payload;

    const departmentExists =
        await Department.exists({
            _id: department,
            isActive: true,
        });

    if (!departmentExists) {
        throw new NotFoundError(
            "Department not found",
        );
    }

    if (auditors.length > 0) {
        const uniqueAuditors = [
            ...new Set(auditors),
        ];

        const validAuditors =
            await User.countDocuments({
                _id: {
                    $in: uniqueAuditors,
                },
                isActive: true,
            });

        if (
            validAuditors !==
            uniqueAuditors.length
        ) {
            throw new BadRequestError(
                "One or more auditors are invalid or inactive",
            );
        }
    }

    const activeAudit =
        await AssetAudit.exists({
            department,
            status: {
                $in: [
                    "scheduled",
                    "in_progress",
                ],
            },
        });

    if (activeAudit) {
        throw new ConflictError(
            "An active audit already exists for this department",
        );
    }

    const assets = await Asset.find({
        department,
        isActive: true,
        status: {
            $ne: "retired",
        },
    })
        .select("_id location")
        .lean();

    if (assets.length === 0) {
        throw new BadRequestError(
            "No active assets found in this department",
        );
    }

    const audit = await AssetAudit.create({
        name,
        department,
        auditors: [
            ...new Set(auditors),
        ],
        startDate,
        endDate,
        totalAssets: assets.length,
        createdBy: currUser.id,
    });

    const auditItems = assets.map(
        (asset) => ({
            audit: audit._id,
            asset: asset._id,
            expectedLocation:
                asset.location || null,
        }),
    );

    await AssetAuditItem.insertMany(
        auditItems,
    );

    return audit;
};


export const getAssetAuditsService = async (
    queryParams,
    currUser,
) => {
    const page =
        Math.max(Number(queryParams.page) || 1, 1);

    const limit = Math.min(
        Math.max(
            Number(queryParams.limit) || 10,
            1,
        ),
        100,
    );

    const skip = (page - 1) * limit;

    const query = {};

    if (
        queryParams.status &&
        [
            "scheduled",
            "in_progress",
            "completed",
        ].includes(queryParams.status)
    ) {
        query.status = queryParams.status;
    }

    if (currUser.role === "department_head") {
        const user = await User.findById(
            currUser.id,
        )
            .select("department")
            .lean();

        if (!user?.department) {
            throw new ForbiddenError(
                "Department head is not assigned to a department",
            );
        }

        query.department = user.department;
    } else if (queryParams.department) {
        query.department =
            queryParams.department;
    }

    const [audits, total] =
        await Promise.all([
            AssetAudit.find(query)
                .populate(
                    "department",
                    "name code",
                )
                .populate(
                    "auditors",
                    "name employeeId role",
                )
                .populate(
                    "createdBy",
                    "name role",
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            AssetAudit.countDocuments(query),
        ]);

    return {
        audits,

        pagination: {
            page,
            limit,
            total,
            totalPages:
                Math.ceil(total / limit),
        },
    };
};


export const getAssetAuditByIdService =
    async (auditId, currUser) => {
        const audit = await AssetAudit.findById(
            auditId,
        )
            .populate(
                "department",
                "name code",
            )
            .populate(
                "auditors",
                "name employeeId role",
            )
            .populate(
                "createdBy",
                "name role",
            )
            .lean();

        if (!audit) {
            throw new NotFoundError(
                "Asset audit not found",
            );
        }

        if (
            currUser.role ===
            "department_head"
        ) {
            const user = await User.findById(
                currUser.id,
            )
                .select("department")
                .lean();

            if (
                !user?.department ||
                String(user.department) !==
                String(audit.department._id)
            ) {
                throw new ForbiddenError(
                    "You cannot access audits outside your department",
                );
            }
        }

        const items =
            await AssetAuditItem.find({
                audit: auditId,
            })
                .populate(
                    "asset",
                    "assetTag name category status condition location",
                )
                .populate(
                    "verifiedBy",
                    "name employeeId",
                )
                .sort({
                    createdAt: 1,
                })
                .lean();

        return {
            ...audit,
            items,
        };
    };


export const startAssetAuditService = async (
    auditId,
) => {
    const audit =
        await AssetAudit.findOneAndUpdate(
            {
                _id: auditId,
                status: "scheduled",
            },
            {
                $set: {
                    status: "in_progress",
                },
            },
            {
                new: true,
                runValidators: true,
            },
        );

    if (!audit) {
        const existing =
            await AssetAudit.findById(auditId)
                .select("status")
                .lean();

        if (!existing) {
            throw new NotFoundError(
                "Asset audit not found",
            );
        }

        throw new ConflictError(
            `Audit cannot be started from status '${existing.status}'`,
        );
    }

    return audit;
};


export const verifyAuditItemService = async (
    auditId,
    itemId,
    payload,
    currUser,
) => {
    const audit = await AssetAudit.findById(
        auditId,
    );

    if (!audit) {
        throw new NotFoundError(
            "Asset audit not found",
        );
    }

    if (audit.status !== "in_progress") {
        throw new ConflictError(
            "Only an in-progress audit can be updated",
        );
    }

    if (
        audit.auditors.length > 0 &&
        !audit.auditors.some(
            (auditorId) =>
                String(auditorId) ===
                String(currUser.id),
        ) &&
        ![
            "admin",
            "asset_manager",
        ].includes(currUser.role)
    ) {
        throw new ForbiddenError(
            "You are not assigned as an auditor for this audit",
        );
    }

    const item =
        await AssetAuditItem.findOne({
            _id: itemId,
            audit: auditId,
        });

    if (!item) {
        throw new NotFoundError(
            "Audit item not found",
        );
    }

    const wasPending =
        item.verificationStatus === "pending";

    const wasDiscrepancy = [
        "missing",
        "damaged",
        "location_mismatch",
    ].includes(item.verificationStatus);

    const isDiscrepancy = [
        "missing",
        "damaged",
        "location_mismatch",
    ].includes(
        payload.verificationStatus,
    );

    item.verificationStatus =
        payload.verificationStatus;

    item.actualLocation =
        payload.actualLocation ?? null;

    item.notes =
        payload.notes ?? null;

    item.verifiedBy = currUser.id;
    item.verifiedAt = new Date();

    await item.save();

    const counterUpdate = {};

    if (wasPending) {
        counterUpdate.verifiedAssets = 1;
    }

    if (!wasDiscrepancy && isDiscrepancy) {
        counterUpdate.discrepancyCount = 1;
    }

    if (wasDiscrepancy && !isDiscrepancy) {
        counterUpdate.discrepancyCount = -1;
    }

    if (
        Object.keys(counterUpdate).length > 0
    ) {
        await AssetAudit.updateOne(
            {
                _id: auditId,
            },
            {
                $inc: counterUpdate,
            },
        );
    }

    return item;
};


export const completeAssetAuditService = async (
    auditId,
) => {
    const audit = await AssetAudit.findById(
        auditId,
    );

    if (!audit) {
        throw new NotFoundError(
            "Asset audit not found",
        );
    }

    if (audit.status !== "in_progress") {
        throw new ConflictError(
            "Only an in-progress audit can be completed",
        );
    }

    const pendingItems =
        await AssetAuditItem.countDocuments({
            audit: auditId,
            verificationStatus: "pending",
        });

    if (pendingItems > 0) {
        throw new ConflictError(
            `${pendingItems} assets are still pending verification`,
        );
    }

    const discrepancyCount =
        await AssetAuditItem.countDocuments({
            audit: auditId,

            verificationStatus: {
                $in: [
                    "missing",
                    "damaged",
                    "location_mismatch",
                ],
            },
        });

    audit.status = "completed";

    audit.verifiedAssets =
        audit.totalAssets;

    audit.discrepancyCount =
        discrepancyCount;

    audit.completedAt = new Date();

    await audit.save();

    return {
        audit,

        discrepancyReport: {
            totalAssets:
                audit.totalAssets,

            verifiedAssets:
                audit.verifiedAssets,

            discrepancies:
                discrepancyCount,
        },
    };
};