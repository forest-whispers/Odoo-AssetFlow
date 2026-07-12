import Department from "./department.model.js";
import User from "../user/user.model.js";

import {
    BadRequestError,
    ConflictError,
    NotFoundError,
} from "../../utils/error.js";

const validateDepartmentHead = async (
    headId,
    currentDepartmentId = null,
) => {
    if (!headId) {
        return null;
    }

    const user = await User.findById(headId);

    if (!user) {
        throw new NotFoundError(
            "Selected department head does not exist",
        );
    }

    if (!user.isActive) {
        throw new BadRequestError(
            "An inactive user cannot be assigned as department head",
        );
    }

    if (user.role !== "department_head") {
        throw new BadRequestError(
            "Selected user must have the department_head role",
        );
    }

    const existingDepartment = await Department.findOne({
        head: headId,
        isActive: true,
        ...(currentDepartmentId && {
            _id: { $ne: currentDepartmentId },
        }),
    });

    if (existingDepartment) {
        throw new ConflictError(
            "This user already heads another active department",
        );
    }

    return user;
};

const validateParentDepartment = async (
    departmentId,
    parentDepartmentId,
) => {
    if (!parentDepartmentId) {
        return;
    }

    if (
        departmentId &&
        departmentId.toString() ===
        parentDepartmentId.toString()
    ) {
        throw new BadRequestError(
            "A department cannot be its own parent",
        );
    }

    const parent = await Department.findById(
        parentDepartmentId,
    );

    if (!parent) {
        throw new NotFoundError(
            "Parent department not found",
        );
    }

    if (!parent.isActive) {
        throw new BadRequestError(
            "An inactive department cannot be assigned as parent",
        );
    }

    if (!departmentId) {
        return;
    }

    let current = parent;

    while (current) {
        if (
            current._id.toString() ===
            departmentId.toString()
        ) {
            throw new BadRequestError(
                "Circular department hierarchy is not allowed",
            );
        }

        if (!current.parentDepartment) {
            break;
        }

        current = await Department.findById(
            current.parentDepartment,
        ).select("_id parentDepartment");
    }
};

const normalizeDepartmentName = (name) => {
    return name.trim();
};

export const createDepartmentService = async ({
    name,
    head,
    parentDepartment,
    description,
}) => {
    const normalizedName =
        normalizeDepartmentName(name);

    const existingDepartment =
        await Department.findOne({
            name: {
                $regex: `^${normalizedName.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&",
                )}$`,
                $options: "i",
            },
        });

    if (existingDepartment) {
        throw new ConflictError(
            "Department with this name already exists",
        );
    }

    await validateParentDepartment(
        null,
        parentDepartment,
    );

    const headUser = await validateDepartmentHead(head);

    const department = await Department.create({
        name: normalizedName,
        head: head || null,
        parentDepartment: parentDepartment || null,
        description: description || null,
    });

    if (headUser) {
        headUser.department = department._id;
        await headUser.save();
    }

    return Department.findById(department._id)
        .populate("head", "name email employeeId role")
        .populate("parentDepartment", "name isActive")
        .lean();
};

export const getDepartmentsService = async (
    queryParams,
) => {
    const query = {};

    if (queryParams.isActive !== undefined) {
        query.isActive =
            queryParams.isActive === "true";
    }

    if (queryParams.search) {
        query.name = {
            $regex: queryParams.search.trim(),
            $options: "i",
        };
    }

    return Department.find(query)
        .populate(
            "head",
            "name email employeeId role isActive",
        )
        .populate(
            "parentDepartment",
            "name isActive",
        )
        .sort({ name: 1 })
        .lean();
};

export const getDepartmentByIdService = async (
    id,
) => {
    const department = await Department.findById(id)
        .populate(
            "head",
            "name email employeeId role isActive",
        )
        .populate(
            "parentDepartment",
            "name isActive",
        )
        .lean();

    if (!department) {
        throw new NotFoundError(
            "Department not found",
        );
    }

    return department;
};

export const updateDepartmentService = async (
    id,
    updates,
) => {
    const department = await Department.findById(id);

    if (!department) {
        throw new NotFoundError(
            "Department not found",
        );
    }

    if (updates.name !== undefined) {
        const normalizedName =
            normalizeDepartmentName(updates.name);

        const existingDepartment =
            await Department.findOne({
                _id: { $ne: id },

                name: {
                    $regex: `^${normalizedName.replace(
                        /[.*+?^${}()|[\]\\]/g,
                        "\\$&",
                    )}$`,
                    $options: "i",
                },
            });

        if (existingDepartment) {
            throw new ConflictError(
                "Department with this name already exists",
            );
        }

        department.name = normalizedName;
    }

    if (updates.parentDepartment !== undefined) {
        await validateParentDepartment(
            id,
            updates.parentDepartment,
        );

        department.parentDepartment =
            updates.parentDepartment || null;
    }

    if (updates.head !== undefined) {
        const previousHead = department.head;

        const newHead = await validateDepartmentHead(
            updates.head,
            id,
        );

        department.head = updates.head || null;

        if (
            previousHead &&
            previousHead.toString() !==
            updates.head?.toString()
        ) {
            await User.updateOne(
                {
                    _id: previousHead,
                    department: department._id,
                },
                {
                    $set: {
                        department: null,
                    },
                },
            );
        }

        if (newHead) {
            newHead.department = department._id;
            await newHead.save();
        }
    }

    if (updates.description !== undefined) {
        department.description =
            updates.description || null;
    }

    if (updates.isActive !== undefined) {
        if (!updates.isActive) {
            const activeChildDepartment =
                await Department.findOne({
                    parentDepartment: department._id,
                    isActive: true,
                });

            if (activeChildDepartment) {
                throw new ConflictError(
                    "Cannot deactivate a department with active child departments",
                );
            }
        }

        department.isActive = updates.isActive;
    }

    await department.save();

    return Department.findById(department._id)
        .populate("head", "name email employeeId role")
        .populate("parentDepartment", "name isActive")
        .lean();
};