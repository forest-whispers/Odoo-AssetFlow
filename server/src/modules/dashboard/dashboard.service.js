import Asset from "../asset/asset.model.js";
import Allocation from "../allocation/allocation.model.js";
import Maintenance from "../maintenance/maintenance.model.js";
import Resource from "../resourceBooking/resource.model.js";
import ResourceBooking from "../resourceBooking/resourceBooking.model.js";
import User from "../user/user.model.js";
import Department from "../department/department.model.js";

import {
    ForbiddenError,
    NotFoundError,
} from "../../utils/error.js";


const getCurrentUser = async (currUser) => {
    const user = await User.findById(currUser.id)
        .select(
            "name email role department employeeId jobTitle isActive",
        )
        .populate(
            "department",
            "name code",
        )
        .lean();

    if (!user) {
        throw new NotFoundError(
            "User not found",
        );
    }

    if (!user.isActive) {
        throw new ForbiddenError(
            "Inactive user cannot access the dashboard",
        );
    }

    return user;
};


const getAdminDashboardService = async (user) => {
    const now = new Date();

    const [
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        retiredAssets,

        totalEmployees,
        totalDepartments,

        activeAllocations,
        pendingMaintenance,
        criticalMaintenance,

        totalResources,
        upcomingBookings,

        recentAllocations,
        recentMaintenance,
    ] = await Promise.all([
        Asset.countDocuments({
            isActive: true,
        }),

        Asset.countDocuments({
            status: "available",
            isActive: true,
        }),

        Asset.countDocuments({
            status: "allocated",
            isActive: true,
        }),

        Asset.countDocuments({
            status: "maintenance",
            isActive: true,
        }),

        Asset.countDocuments({
            status: "retired",
        }),

        User.countDocuments({
            role: {
                $in: [
                    "employee",
                    "department_head",
                ],
            },
            isActive: true,
        }),

        Department.countDocuments({
            isActive: true,
        }),

        Allocation.countDocuments({
            status: "active",
        }),

        Maintenance.countDocuments({
            status: "pending",
        }),

        Maintenance.countDocuments({
            status: {
                $in: [
                    "pending",
                    "in_progress",
                ],
            },
            priority: "critical",
        }),

        Resource.countDocuments({
            isActive: true,
        }),

        ResourceBooking.countDocuments({
            status: "booked",
            startTime: {
                $gte: now,
            },
        }),

        Allocation.find()
            .populate(
                "asset",
                "assetTag name",
            )
            .populate(
                "employee",
                "name employeeId",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),

        Maintenance.find()
            .populate(
                "asset",
                "assetTag name",
            )
            .populate(
                "reportedBy",
                "name employeeId",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),
    ]);

    return {
        role: user.role,

        profile: {
            name: user.name,
            email: user.email,
        },

        stats: {
            totalAssets,
            availableAssets,
            allocatedAssets,
            maintenanceAssets,
            retiredAssets,

            totalEmployees,
            totalDepartments,

            activeAllocations,
            pendingMaintenance,
            criticalMaintenance,

            totalResources,
            upcomingBookings,
        },

        recentActivity: {
            allocations: recentAllocations,
            maintenance: recentMaintenance,
        },
    };
};


const getAssetManagerDashboardService = async (
    user,
) => {
    const now = new Date();

    const [
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        retiredAssets,

        activeAllocations,
        pendingMaintenance,
        inProgressMaintenance,
        criticalMaintenance,

        totalResources,
        upcomingBookings,

        recentAllocations,
        recentMaintenance,
    ] = await Promise.all([
        Asset.countDocuments({
            isActive: true,
        }),

        Asset.countDocuments({
            status: "available",
            isActive: true,
        }),

        Asset.countDocuments({
            status: "allocated",
            isActive: true,
        }),

        Asset.countDocuments({
            status: "maintenance",
            isActive: true,
        }),

        Asset.countDocuments({
            status: "retired",
        }),

        Allocation.countDocuments({
            status: "active",
        }),

        Maintenance.countDocuments({
            status: "pending",
        }),

        Maintenance.countDocuments({
            status: "in_progress",
        }),

        Maintenance.countDocuments({
            status: {
                $in: [
                    "pending",
                    "in_progress",
                ],
            },
            priority: "critical",
        }),

        Resource.countDocuments({
            isActive: true,
        }),

        ResourceBooking.countDocuments({
            status: "booked",
            startTime: {
                $gte: now,
            },
        }),

        Allocation.find()
            .populate(
                "asset",
                "assetTag name status condition",
            )
            .populate(
                "employee",
                "name employeeId",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),

        Maintenance.find({
            status: {
                $in: [
                    "pending",
                    "in_progress",
                ],
            },
        })
            .populate(
                "asset",
                "assetTag name status",
            )
            .populate(
                "reportedBy",
                "name employeeId",
            )
            .sort({
                priority: -1,
                createdAt: -1,
            })
            .limit(5)
            .lean(),
    ]);

    return {
        role: user.role,

        profile: {
            name: user.name,
            email: user.email,
        },

        stats: {
            totalAssets,
            availableAssets,
            allocatedAssets,
            maintenanceAssets,
            retiredAssets,

            activeAllocations,

            pendingMaintenance,
            inProgressMaintenance,
            criticalMaintenance,

            totalResources,
            upcomingBookings,
        },

        recentActivity: {
            allocations: recentAllocations,
            maintenance: recentMaintenance,
        },
    };
};


const getDepartmentHeadDashboardService = async (user) => {
    if (!user.department) {
        throw new ForbiddenError(
            "Department head is not assigned to a department",
        );
    }

    const departmentId = user.department._id;
    const now = new Date();

    const departmentAssetIds = await Asset.find({
        department: departmentId,
    }).distinct("_id");

    const [
        departmentEmployees,
        departmentAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        activeAllocations,
        pendingMaintenance,
        upcomingBookings,
        recentAllocations,
        recentMaintenance,
    ] = await Promise.all([
        User.countDocuments({
            department: departmentId,
            isActive: true,
        }),

        Asset.countDocuments({
            department: departmentId,
            isActive: true,
        }),

        Asset.countDocuments({
            department: departmentId,
            status: "available",
            isActive: true,
        }),

        Asset.countDocuments({
            department: departmentId,
            status: "allocated",
            isActive: true,
        }),

        Asset.countDocuments({
            department: departmentId,
            status: "maintenance",
            isActive: true,
        }),

        Allocation.countDocuments({
            department: departmentId,
            status: "active",
        }),

        Maintenance.countDocuments({
            status: "pending",
            asset: {
                $in: departmentAssetIds,
            },
        }),

        ResourceBooking.countDocuments({
            department: departmentId,
            status: "booked",
            startTime: {
                $gte: now,
            },
        }),

        Allocation.find({
            department: departmentId,
        })
            .populate(
                "asset",
                "assetTag name status condition",
            )
            .populate(
                "employee",
                "name employeeId jobTitle",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),

        Maintenance.find({
            asset: {
                $in: departmentAssetIds,
            },
        })
            .populate(
                "asset",
                "assetTag name status",
            )
            .populate(
                "reportedBy",
                "name employeeId",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),
    ]);

    return {
        role: user.role,

        profile: {
            name: user.name,
            email: user.email,

            department: {
                _id: user.department._id,
                name: user.department.name,
                code: user.department.code,
            },
        },

        stats: {
            departmentEmployees,
            departmentAssets,
            availableAssets,
            allocatedAssets,
            maintenanceAssets,
            activeAllocations,
            pendingMaintenance,
            upcomingBookings,
        },

        recentActivity: {
            allocations: recentAllocations,
            maintenance: recentMaintenance,
        },
    };
};


const getEmployeeDashboardService = async (
    user,
) => {
    const now = new Date();

    const [
        activeAllocations,
        pendingMaintenance,
        inProgressMaintenance,
        upcomingBookings,

        recentAllocations,
        recentMaintenance,
        nextBooking,
    ] = await Promise.all([
        Allocation.countDocuments({
            employee: user._id,
            status: "active",
        }),

        Maintenance.countDocuments({
            reportedBy: user._id,
            status: "pending",
        }),

        Maintenance.countDocuments({
            reportedBy: user._id,
            status: "in_progress",
        }),

        ResourceBooking.countDocuments({
            bookedBy: user._id,
            status: "booked",
            startTime: {
                $gte: now,
            },
        }),

        Allocation.find({
            employee: user._id,
        })
            .populate(
                "asset",
                "assetTag name status condition location",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),

        Maintenance.find({
            reportedBy: user._id,
        })
            .populate(
                "asset",
                "assetTag name status condition",
            )
            .sort({
                createdAt: -1,
            })
            .limit(5)
            .lean(),

        ResourceBooking.findOne({
            bookedBy: user._id,
            status: "booked",
            startTime: {
                $gte: now,
            },
        })
            .populate(
                "resource",
                "name type location",
            )
            .sort({
                startTime: 1,
            })
            .lean(),
    ]);

    return {
        role: user.role,

        profile: {
            name: user.name,
            email: user.email,
            employeeId: user.employeeId,
            jobTitle: user.jobTitle,

            department: user.department
                ? {
                    _id: user.department._id,
                    name: user.department.name,
                    code: user.department.code,
                }
                : null,
        },

        stats: {
            activeAllocations,
            pendingMaintenance,
            inProgressMaintenance,
            upcomingBookings,
        },

        recentActivity: {
            allocations: recentAllocations,
            maintenance: recentMaintenance,
        },

        nextBooking,
    };
};


export const getDashboardService = async (
    currUser,
) => {
    const user = await getCurrentUser(currUser);

    switch (user.role) {
        case "admin":
            return getAdminDashboardService(user);

        case "asset_manager":
            return getAssetManagerDashboardService(
                user,
            );

        case "department_head":
            return getDepartmentHeadDashboardService(
                user,
            );

        case "employee":
            return getEmployeeDashboardService(
                user,
            );

        default:
            throw new ForbiddenError(
                "Unsupported user role",
            );
    }
};