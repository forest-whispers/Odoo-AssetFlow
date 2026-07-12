import mongoose from "mongoose";

import Allocation from "./allocation.model.js";
import Asset from "../asset/asset.model.js";
import User from "../user/user.model.js";

import { createAuditLogService } from "../auditLog/auditLog.service.js";

import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../../utils/error.js";


const validateEmployeeForAllocation = async (
    employeeId,
) => {
    const employee = await User.findById(employeeId)
        .select(
            "name email role department isActive",
        )
        .lean();

    if (!employee) {
        throw new NotFoundError(
            "Employee not found",
        );
    }

    if (!employee.isActive) {
        throw new BadRequestError(
            "Cannot allocate an asset to an inactive employee",
        );
    }

    if (!employee.department) {
        throw new BadRequestError(
            "Employee must belong to a department before receiving an asset",
        );
    }

    return employee;
};


export const createAllocationService = async (
    currUser,
    {
        asset: assetId,
        employee: employeeId,
        notes,
    },
) => {
    const employee =
        await validateEmployeeForAllocation(
            employeeId,
        );

    /*
        Atomic transition:

        Only one request can successfully change
        available -> allocated.
    */
    const asset = await Asset.findOneAndUpdate(
        {
            _id: assetId,
            status: "available",
            isActive: true,
        },
        {
            $set: {
                status: "allocated",
            },
        },
        {
            new: true,
            runValidators: true,
        },
    );

    if (!asset) {
        const existingAsset = await Asset.findById(
            assetId,
        )
            .select("status isActive")
            .lean();

        if (!existingAsset) {
            throw new NotFoundError(
                "Asset not found",
            );
        }

        if (!existingAsset.isActive) {
            throw new ConflictError(
                "Inactive or retired asset cannot be allocated",
            );
        }

        throw new ConflictError(
            `Asset is currently ${existingAsset.status} and cannot be allocated`,
        );
    }

    try {
        const allocation = await Allocation.create({
            asset: asset._id,
            employee: employee._id,
            department: employee.department,
            allocatedBy: currUser.id,
            notes: notes || null,
        });

        await createAuditLogService(
            currUser.id,
            "asset_allocated",
            "allocation",
            allocation._id,
            {
                asset: asset._id,
                assetTag: asset.assetTag,
                employee: employee._id,
                employeeName: employee.name,
                department: employee.department,
            },
        );

        return allocation;
    } catch (error) {
        /*
            Compensating rollback.

            If Allocation.create() fails after the asset
            was marked allocated, restore it to available.
        */
        await Asset.findOneAndUpdate(
            {
                _id: asset._id,
                status: "allocated",
            },
            {
                $set: {
                    status: "available",
                },
            },
        );

        if (error?.code === 11000) {
            throw new ConflictError(
                "Asset already has an active allocation",
            );
        }

        throw error;
    }
};


export const getAllocationsService = async (
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

    if (
        queryParams.status &&
        [
            "active",
            "returned",
            "transferred",
        ].includes(queryParams.status)
    ) {
        query.status = queryParams.status;
    }

    if (queryParams.employee) {
        query.employee = queryParams.employee;
    }

    if (queryParams.department) {
        query.department = queryParams.department;
    }

    if (queryParams.asset) {
        query.asset = queryParams.asset;
    }

    const [allocations, totalAllocations] =
        await Promise.all([
            Allocation.find(query)
                .populate(
                    "asset",
                    "assetTag name status condition",
                )
                .populate(
                    "employee",
                    "name email employeeId jobTitle",
                )
                .populate(
                    "department",
                    "name code",
                )
                .populate(
                    "allocatedBy",
                    "name role",
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            Allocation.countDocuments(query),
        ]);

    return {
        allocations,

        pagination: {
            page,
            limit,
            total: totalAllocations,
            totalPages: Math.ceil(
                totalAllocations / limit,
            ),
        },
    };
};


export const getAllocationService = async (
    allocationId,
) => {
    const allocation = await Allocation.findById(
        allocationId,
    )
        .populate(
            "asset",
            "assetTag name category status condition location serialNumber",
        )
        .populate(
            "employee",
            "name email employeeId jobTitle",
        )
        .populate(
            "department",
            "name code",
        )
        .populate(
            "allocatedBy",
            "name role",
        )
        .populate(
            "transferredFrom",
            "employee allocatedAt",
        )
        .populate(
            "transferredTo",
            "employee allocatedAt",
        )
        .lean();

    if (!allocation) {
        throw new NotFoundError(
            "Allocation not found",
        );
    }

    return allocation;
};


export const returnAssetService = async (
    currUser,
    allocationId,
    {
        condition,
        notes,
    },
) => {
    const allocation =
        await Allocation.findOneAndUpdate(
            {
                _id: allocationId,
                status: "active",
            },
            {
                $set: {
                    status: "returned",
                    returnedAt: new Date(),
                },
            },
            {
                new: false,
            },
        );

    if (!allocation) {
        const existingAllocation =
            await Allocation.findById(allocationId)
                .select("status")
                .lean();

        if (!existingAllocation) {
            throw new NotFoundError(
                "Allocation not found",
            );
        }

        throw new ConflictError(
            `Cannot return an allocation with status '${existingAllocation.status}'`,
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
            _id: allocation.asset,
            status: "allocated",
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
            Restore allocation because asset state
            transition failed.
        */
        await Allocation.findByIdAndUpdate(
            allocation._id,
            {
                $set: {
                    status: "active",
                    returnedAt: null,
                },
            },
        );

        throw new ConflictError(
            "Asset state changed while processing the return",
        );
    }

    await createAuditLogService(
        currUser.id,
        "asset_returned",
        "allocation",
        allocation._id,
        {
            asset: asset._id,
            assetTag: asset.assetTag,
            employee: allocation.employee,
            condition: condition || asset.condition,
            notes: notes || null,
        },
    );

    return {
        allocationId: allocation._id,
        asset: {
            _id: asset._id,
            assetTag: asset.assetTag,
            status: asset.status,
            condition: asset.condition,
        },
    };
};


export const transferAssetService = async (
    currUser,
    allocationId,
    {
        employee: newEmployeeId,
        notes,
    },
) => {
    const currentAllocation =
        await Allocation.findById(allocationId);

    if (!currentAllocation) {
        throw new NotFoundError(
            "Allocation not found",
        );
    }

    if (currentAllocation.status !== "active") {
        throw new ConflictError(
            "Only an active allocation can be transferred",
        );
    }

    if (
        currentAllocation.employee.toString() ===
        newEmployeeId
    ) {
        throw new BadRequestError(
            "Asset is already allocated to this employee",
        );
    }

    const newEmployee =
        await validateEmployeeForAllocation(
            newEmployeeId,
        );

    /*
        Atomically claim the current allocation for transfer.

        Only one concurrent transfer request can succeed.
    */
    const claimedAllocation =
        await Allocation.findOneAndUpdate(
            {
                _id: allocationId,
                status: "active",
            },
            {
                $set: {
                    status: "transferred",
                },
            },
            {
                new: false,
            },
        );

    if (!claimedAllocation) {
        throw new ConflictError(
            "Allocation is no longer active",
        );
    }

    try {
        const newAllocation =
            await Allocation.create({
                asset: claimedAllocation.asset,
                employee: newEmployee._id,
                department: newEmployee.department,
                allocatedBy: currUser.id,
                notes: notes || null,
                transferredFrom:
                    claimedAllocation._id,
            });

        await Allocation.findByIdAndUpdate(
            claimedAllocation._id,
            {
                $set: {
                    transferredTo:
                        newAllocation._id,
                },
            },
        );

        await createAuditLogService(
            currUser.id,
            "asset_transferred",
            "allocation",
            newAllocation._id,
            {
                asset: claimedAllocation.asset,
                fromEmployee:
                    claimedAllocation.employee,
                toEmployee: newEmployee._id,
                toEmployeeName: newEmployee.name,
                fromDepartment:
                    claimedAllocation.department,
                toDepartment:
                    newEmployee.department,
            },
        );

        return newAllocation;
    } catch (error) {
        /*
            Restore previous allocation if creation
            of the new allocation fails.
        */
        await Allocation.findByIdAndUpdate(
            claimedAllocation._id,
            {
                $set: {
                    status: "active",
                },
            },
        );

        if (error?.code === 11000) {
            throw new ConflictError(
                "Asset already has another active allocation",
            );
        }

        throw error;
    }
};