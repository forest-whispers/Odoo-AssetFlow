import Maintenance from "./maintenance.model.js";
import Asset from "../asset/asset.model.js";
import Allocation from "../allocation/allocation.model.js";

import { createAuditLogService } from "../auditLog/auditLog.service.js";
import { createNotificationService, notifyRolesService } from "../notification/notification.service.js";

import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/error.js";


export const createMaintenanceService = async (
    currUser,
    {
        asset: assetId,
        issueType,
        priority,
        description,
    },
) => {
    const asset = await Asset.findById(assetId)
        .select(
            "assetTag name status isActive",
        )
        .lean();

    if (!asset) {
        throw new NotFoundError(
            "Asset not found",
        );
    }

    if (!asset.isActive || asset.status === "retired") {
        throw new BadRequestError(
            "Cannot create a maintenance request for a retired or inactive asset",
        );
    }

    if (asset.status === "maintenance") {
        throw new ConflictError(
            "Asset is already under maintenance",
        );
    }

    /*
        Employees and department heads can only report
        an allocated asset if it is currently allocated
        to them.

        Admins and asset managers may report any
        eligible asset.
    */
    if (
        ["employee", "department_head"].includes(
            currUser.role,
        )
    ) {
        const activeAllocation =
            await Allocation.findOne({
                asset: assetId,
                employee: currUser.id,
                status: "active",
            })
                .select("_id")
                .lean();

        if (!activeAllocation) {
            throw new ForbiddenError(
                "You can only report maintenance for an asset currently allocated to you",
            );
        }
    }

    try {
        const maintenance =
            await Maintenance.create({
                asset: assetId,
                reportedBy: currUser.id,
                issueType,
                priority,
                description,
            });

        await createAuditLogService(
            currUser.id,
            "maintenance_requested",
            "maintenance",
            maintenance._id,
            {
                asset: asset._id,
                assetTag: asset.assetTag,
                priority:
                    maintenance.priority,
                issueType:
                    maintenance.issueType,
            },
        );

        await notifyRolesService({
            roles: ["admin", "asset_manager"],
            type: "maintenance",
            title: "New Maintenance Request",
            message: `New maintenance request submitted for asset ${asset.assetTag} (${asset.name}).`,
            entityType: "maintenance",
            entityId: maintenance._id
        });

        return maintenance;
    } catch (error) {
        if (error?.code === 11000) {
            throw new ConflictError(
                "An active maintenance request already exists for this asset",
            );
        }

        throw error;
    }
};


export const getMaintenanceRequestsService = async (
    currUser,
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

    /*
        Employees see their own requests.

        Admins and asset managers see all requests.

        Department heads currently see their own requests.
        Department-wide visibility can be added later if needed.
    */
    if (
        ["employee", "department_head"].includes(
            currUser.role,
        )
    ) {
        query.reportedBy = currUser.id;
    }

    if (
        queryParams.status &&
        [
            "pending",
            "in_progress",
            "resolved",
            "rejected",
        ].includes(queryParams.status)
    ) {
        query.status = queryParams.status;
    }

    if (
        queryParams.priority &&
        [
            "low",
            "medium",
            "high",
            "critical",
        ].includes(queryParams.priority)
    ) {
        query.priority = queryParams.priority;
    }

    if (queryParams.asset) {
        query.asset = queryParams.asset;
    }

    const [requests, totalRequests] =
        await Promise.all([
            Maintenance.find(query)
                .populate(
                    "asset",
                    "assetTag name status condition location",
                )
                .populate(
                    "reportedBy",
                    "name email employeeId jobTitle",
                )
                .populate(
                    "reviewedBy",
                    "name role",
                )
                .populate(
                    "resolvedBy",
                    "name role",
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            Maintenance.countDocuments(query),
        ]);

    return {
        requests,

        pagination: {
            page,
            limit,
            total: totalRequests,
            totalPages: Math.ceil(
                totalRequests / limit,
            ),
        },
    };
};


export const getMaintenanceRequestService = async (
    currUser,
    maintenanceId,
) => {
    const maintenance =
        await Maintenance.findById(maintenanceId)
            .populate(
                "asset",
                "assetTag name category department status condition location serialNumber",
            )
            .populate(
                "reportedBy",
                "name email employeeId jobTitle department",
            )
            .populate(
                "reviewedBy",
                "name role",
            )
            .populate(
                "resolvedBy",
                "name role",
            )
            .lean();

    if (!maintenance) {
        throw new NotFoundError(
            "Maintenance request not found",
        );
    }

    if (
        ["employee", "department_head"].includes(
            currUser.role,
        ) &&
        maintenance.reportedBy._id.toString() !==
        currUser.id
    ) {
        throw new ForbiddenError(
            "You cannot access this maintenance request",
        );
    }

    return maintenance;
};


export const approveMaintenanceService = async (
    currUser,
    maintenanceId,
) => {
    const maintenance =
        await Maintenance.findById(maintenanceId)
            .select(
                "asset status reportedBy priority issueType",
            )
            .lean();

    if (!maintenance) {
        throw new NotFoundError(
            "Maintenance request not found",
        );
    }

    if (maintenance.status !== "pending") {
        throw new ConflictError(
            `Cannot approve a maintenance request with status '${maintenance.status}'`,
        );
    }

    /*
        Only an available asset may enter maintenance.

        If currently allocated, it must first go through
        the return workflow.
    */
    const asset = await Asset.findOneAndUpdate(
        {
            _id: maintenance.asset,
            status: "available",
            isActive: true,
        },
        {
            $set: {
                status: "maintenance",
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (!asset) {
        const existingAsset = await Asset.findById(
            maintenance.asset,
        )
            .select("status isActive")
            .lean();

        if (!existingAsset) {
            throw new NotFoundError(
                "Asset not found",
            );
        }

        if (
            existingAsset.status === "allocated"
        ) {
            throw new ConflictError(
                "Allocated asset must be returned before maintenance can begin",
            );
        }

        throw new ConflictError(
            `Asset is currently '${existingAsset.status}' and cannot enter maintenance`,
        );
    }

    const updatedMaintenance =
        await Maintenance.findOneAndUpdate(
            {
                _id: maintenanceId,
                status: "pending",
            },
            {
                $set: {
                    status: "in_progress",
                    reviewedBy: currUser.id,
                    reviewedAt: new Date(),
                },
            },
            {
                new: true,
                runValidators: true,
            },
        );

    if (!updatedMaintenance) {
        /*
            Compensating rollback if another request
            changed maintenance status concurrently.
        */
        await Asset.findOneAndUpdate(
            {
                _id: asset._id,
                status: "maintenance",
            },
            {
                $set: {
                    status: "available",
                },
            },
        );

        throw new ConflictError(
            "Maintenance request state changed while processing approval",
        );
    }

    await createAuditLogService(
        currUser.id,
        "maintenance_approved",
        "maintenance",
        updatedMaintenance._id,
        {
            asset: asset._id,
            assetTag: asset.assetTag,
            previousAssetStatus: "available",
            newAssetStatus: "maintenance",
        },
    );

    await createNotificationService({
        recipient: updatedMaintenance.reportedBy,
        type: "approval",
        title: "Maintenance Request Approved",
        message: `Your maintenance request for asset ${asset.assetTag} (${asset.name}) has been approved and is now in progress.`,
        entityType: "maintenance",
        entityId: updatedMaintenance._id
    });

    return updatedMaintenance;
};


export const rejectMaintenanceService = async (
    currUser,
    maintenanceId,
    {
        reason,
    },
) => {
    const maintenance =
        await Maintenance.findOneAndUpdate(
            {
                _id: maintenanceId,
                status: "pending",
            },
            {
                $set: {
                    status: "rejected",
                    rejectionReason: reason,
                    reviewedBy: currUser.id,
                    reviewedAt: new Date(),
                },
            },
            {
                new: true,
                runValidators: true,
            },
        );

    if (!maintenance) {
        const existing =
            await Maintenance.findById(
                maintenanceId,
            )
                .select("status")
                .lean();

        if (!existing) {
            throw new NotFoundError(
                "Maintenance request not found",
            );
        }

        throw new ConflictError(
            `Cannot reject a maintenance request with status '${existing.status}'`,
        );
    }

    await createAuditLogService(
        currUser.id,
        "maintenance_rejected",
        "maintenance",
        maintenance._id,
        {
            asset: maintenance.asset,
            reason,
        },
    );

    const rejectedAsset = await Asset.findById(maintenance.asset).select("assetTag name").lean();
    const assetInfo = rejectedAsset ? `${rejectedAsset.assetTag} (${rejectedAsset.name})` : "your asset";

    await createNotificationService({
        recipient: maintenance.reportedBy,
        type: "approval",
        title: "Maintenance Request Rejected",
        message: `Your maintenance request for asset ${assetInfo} has been rejected. Reason: ${reason}`,
        entityType: "maintenance",
        entityId: maintenance._id
    });

    return maintenance;
};


export const resolveMaintenanceService = async (
    currUser,
    maintenanceId,
    {
        resolutionNotes,
        condition,
    },
) => {
    /*
        Atomically claim the in-progress maintenance
        request so only one resolution can succeed.
    */
    const maintenance =
        await Maintenance.findOneAndUpdate(
            {
                _id: maintenanceId,
                status: "in_progress",
            },
            {
                $set: {
                    status: "resolved",
                    resolutionNotes,
                    resolvedBy: currUser.id,
                    resolvedAt: new Date(),
                },
            },
            {
                new: false,
            },
        );

    if (!maintenance) {
        const existing =
            await Maintenance.findById(
                maintenanceId,
            )
                .select("status")
                .lean();

        if (!existing) {
            throw new NotFoundError(
                "Maintenance request not found",
            );
        }

        throw new ConflictError(
            `Cannot resolve a maintenance request with status '${existing.status}'`,
        );
    }

    const assetUpdate = {
        status: "available",
    };

    if (condition) {
        assetUpdate.condition = condition;
    }

    const asset = await Asset.findOneAndUpdate(
        {
            _id: maintenance.asset,
            status: "maintenance",
            isActive: true,
        },
        {
            $set: assetUpdate,
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (!asset) {
        /*
            Restore maintenance request because asset
            state transition failed.
        */
        await Maintenance.findByIdAndUpdate(
            maintenance._id,
            {
                $set: {
                    status: "in_progress",
                    resolutionNotes: null,
                    resolvedBy: null,
                    resolvedAt: null,
                },
            },
        );

        throw new ConflictError(
            "Asset state changed while resolving maintenance",
        );
    }

    await createAuditLogService(
        currUser.id,
        "maintenance_resolved",
        "maintenance",
        maintenance._id,
        {
            asset: asset._id,
            assetTag: asset.assetTag,
            previousAssetStatus: "maintenance",
            newAssetStatus: "available",
            condition: asset.condition,
        },
    );

    await createNotificationService({
        recipient: maintenance.reportedBy,
        type: "approval",
        title: "Maintenance Completed",
        message: `Maintenance breakdown request resolved for asset ${asset.assetTag} (${asset.name}). Notes: ${resolutionNotes}`,
        entityType: "maintenance",
        entityId: maintenance._id
    });

    return {
        maintenanceId: maintenance._id,

        asset: {
            _id: asset._id,
            assetTag: asset.assetTag,
            status: asset.status,
            condition: asset.condition,
        },
    };
};