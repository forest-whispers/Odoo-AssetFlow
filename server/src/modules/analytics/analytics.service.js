import Asset from "../asset/asset.model.js";
import Allocation from "../allocation/allocation.model.js";
import Maintenance from "../maintenance/maintenance.model.js";
import ResourceBooking from "../resourceBooking/resourceBooking.model.js";
import User from "../user/user.model.js";

import {
    ForbiddenError,
    NotFoundError,
} from "../../utils/error.js";


const getDateRange = (range) => {
    const now = new Date();

    const startDate = new Date();

    switch (range) {
        case "7d":
            startDate.setDate(now.getDate() - 6);
            break;

        case "30d":
            startDate.setDate(now.getDate() - 29);
            break;

        case "90d":
            startDate.setDate(now.getDate() - 89);
            break;

        default:
            startDate.setDate(now.getDate() - 29);
    }

    startDate.setHours(0, 0, 0, 0);

    return {
        startDate,
        endDate: now,
    };
};


const getAnalyticsScope = async (currUser) => {
    if (
        currUser.role === "admin" ||
        currUser.role === "asset_manager"
    ) {
        return {
            assetFilter: {
                isActive: true,
            },

            allocationFilter: {},

            departmentId: null,
        };
    }

    if (currUser.role === "department_head") {
        const user = await User.findById(currUser.id)
            .select("department isActive")
            .lean();

        if (!user) {
            throw new NotFoundError(
                "User not found",
            );
        }

        if (!user.department) {
            throw new ForbiddenError(
                "Department head is not assigned to a department",
            );
        }

        return {
            assetFilter: {
                department: user.department,
                isActive: true,
            },

            allocationFilter: {
                department: user.department,
            },

            departmentId: user.department,
        };
    }

    throw new ForbiddenError(
        "You do not have permission to access analytics",
    );
};

const retirementAgeThreshold = new Date();

retirementAgeThreshold.setFullYear(
    retirementAgeThreshold.getFullYear() - 4
);


export const getAnalyticsService = async (
    currUser,
    queryParams = {},
) => {
    const {
        startDate,
        endDate,
    } = getDateRange(queryParams.range);

    const {
        assetFilter,
        allocationFilter,
        departmentId,
    } = await getAnalyticsScope(currUser);

    const now = new Date();

    const idleThreshold = new Date();
    idleThreshold.setDate(
        now.getDate() - 30,
    );

    const maintenanceDueThreshold = new Date();
    maintenanceDueThreshold.setDate(
        now.getDate() + 30,
    );

    const retirementThreshold = new Date();
    retirementThreshold.setDate(
        now.getDate() + 180,
    );

    const scopedAssetIds = await Asset.find(
        assetFilter,
    ).distinct("_id");

    const maintenanceFilter = {
        asset: {
            $in: scopedAssetIds,
        },
    };

    const bookingFilter = {
        status: {
            $in: ["booked", "completed"],
        },

        createdAt: {
            $gte: startDate,
            $lte: endDate,
        },
    };

    if (departmentId) {
        bookingFilter.department = departmentId;
    }

    const [
        assetStats,

        utilizationByDepartment,

        maintenanceTrend,

        maintenanceFrequency,

        mostUsedAssets,

        mostUsedResources,

        idleAssets,

        assetsNearingRetirement,

        bookingHeatmap,
    ] = await Promise.all([
        Asset.aggregate([
            {
                $match: assetFilter,
            },

            {
                $group: {
                    _id: null,

                    totalAssets: {
                        $sum: 1,
                    },

                    availableAssets: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "available",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    allocatedAssets: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "allocated",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },

                    underMaintenance: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "maintenance",
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]),


        Allocation.aggregate([
            {
                $match: {
                    ...allocationFilter,
                    status: "active",
                },
            },

            {
                $group: {
                    _id: "$department",

                    allocatedAssets: {
                        $sum: 1,
                    },
                },
            },

            {
                $lookup: {
                    from: "departments",
                    localField: "_id",
                    foreignField: "_id",
                    as: "department",
                },
            },

            {
                $unwind: "$department",
            },

            {
                $project: {
                    _id: 1,

                    departmentName:
                        "$department.name",

                    allocatedAssets: 1,
                },
            },

            {
                $sort: {
                    allocatedAssets: -1,
                },
            },
        ]),


        Maintenance.aggregate([
            {
                $match: {
                    ...maintenanceFilter,

                    createdAt: {
                        $gte: startDate,
                        $lte: endDate,
                    },
                },
            },

            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt",
                        },
                    },

                    maintenanceRequests: {
                        $sum: 1,
                    },
                },
            },

            {
                $sort: {
                    _id: 1,
                },
            },
        ]),


        Maintenance.aggregate([
            {
                $match: maintenanceFilter,
            },

            {
                $group: {
                    _id: "$asset",
                    maintenanceCount: {
                        $sum: 1,
                    },
                },
            },

            {
                $sort: {
                    maintenanceCount: -1,
                },
            },

            {
                $limit: 5,
            },

            {
                $lookup: {
                    from: "assets",
                    localField: "_id",
                    foreignField: "_id",
                    as: "asset",
                },
            },

            {
                $unwind: "$asset",
            },

            {
                $project: {
                    _id: 1,
                    assetTag: "$asset.assetTag",
                    name: "$asset.name",
                    status: "$asset.status",
                    condition: "$asset.condition",
                    maintenanceCount: 1,
                },
            },
        ]),


        Allocation.aggregate([
            {
                $match: {
                    ...allocationFilter,

                    asset: {
                        $in: scopedAssetIds,
                    },
                },
            },

            {
                $group: {
                    _id: "$asset",

                    allocationCount: {
                        $sum: 1,
                    },
                },
            },

            {
                $sort: {
                    allocationCount: -1,
                },
            },

            {
                $limit: 5,
            },

            {
                $lookup: {
                    from: "assets",
                    localField: "_id",
                    foreignField: "_id",
                    as: "asset",
                },
            },

            {
                $unwind: "$asset",
            },

            {
                $project: {
                    _id: 1,
                    assetTag: "$asset.assetTag",
                    name: "$asset.name",
                    status: "$asset.status",
                    condition: "$asset.condition",
                    allocationCount: 1,
                },
            },
        ]),


        ResourceBooking.aggregate([
            {
                $match: bookingFilter,
            },

            {
                $group: {
                    _id: "$resource",

                    bookingCount: {
                        $sum: 1,
                    },
                },
            },

            {
                $sort: {
                    bookingCount: -1,
                },
            },

            {
                $limit: 5,
            },

            {
                $lookup: {
                    from: "resources",
                    localField: "_id",
                    foreignField: "_id",
                    as: "resource",
                },
            },

            {
                $unwind: "$resource",
            },

            {
                $project: {
                    _id: 1,
                    name: "$resource.name",
                    type: "$resource.type",
                    location: "$resource.location",
                    bookingCount: 1,
                },
            },
        ]),


        Asset.aggregate([
            {
                $match: {
                    ...assetFilter,
                    status: "available",
                },
            },

            {
                $lookup: {
                    from: "allocations",
                    localField: "_id",
                    foreignField: "asset",
                    as: "allocationHistory",
                },
            },

            {
                $addFields: {
                    lastAllocation: {
                        $max: "$allocationHistory.allocatedAt",
                    },
                },
            },

            {
                $match: {
                    $or: [
                        {
                            lastAllocation: {
                                $lte: idleThreshold,
                            },
                        },
                        {
                            lastAllocation: null,
                        },
                    ],
                },
            },

            {
                $project: {
                    assetTag: 1,
                    name: 1,
                    status: 1,
                    location: 1,
                    purchaseDate: 1,
                    createdAt: 1,
                    lastAllocation: 1,
                },
            },

            {
                $sort: {
                    lastAllocation: 1,
                },
            },

            {
                $limit: 10,
            },
        ]),


        Asset.find({
            ...assetFilter,

            purchaseDate: {
                $ne: null,
                $lte: retirementAgeThreshold,
            },

            status: {
                $ne: "retired",
            },
        })
            .select(
                "assetTag name status condition purchaseDate location",
            )
            .sort({
                purchaseDate: 1,
            })
            .limit(10)
            .lean(),


        ResourceBooking.aggregate([
            {
                $match: bookingFilter,
            },

            {
                $group: {
                    _id: {
                        dayOfWeek: {
                            $dayOfWeek:
                                "$startTime",
                        },

                        hour: {
                            $hour:
                                "$startTime",
                        },
                    },

                    bookings: {
                        $sum: 1,
                    },
                },
            },

            {
                $project: {
                    _id: 0,

                    dayOfWeek:
                        "$_id.dayOfWeek",

                    hour:
                        "$_id.hour",

                    bookings: 1,
                },
            },

            {
                $sort: {
                    dayOfWeek: 1,
                    hour: 1,
                },
            },
        ]),
    ]);

    const stats = assetStats[0] || {};

    const totalAssets =
        stats.totalAssets || 0;

    const allocatedAssets =
        stats.allocatedAssets || 0;

    const utilizationRate =
        totalAssets > 0
            ? Number(
                (
                    (
                        allocatedAssets /
                        totalAssets
                    ) * 100
                ).toFixed(1),
            )
            : 0;

    return {
        kpis: {
            totalAssets,

            availableAssets:
                stats.availableAssets || 0,

            allocatedAssets,

            underMaintenance:
                stats.underMaintenance || 0,

            utilizationRate,
        },

        utilizationByDepartment,

        maintenanceTrend,

        maintenanceFrequency,

        mostUsedAssets,

        mostUsedResources,

        idleAssets,

        assetsNearingRetirement,

        bookingHeatmap,
    };
};