import bcrypt from "bcrypt";

import User from "./user.model.js";

import {
    ConflictError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/error.js";

export const createUserService = async ({
    name,
    email,
    password,
    employeeId,
    jobTitle,
}) => {
    const alreadyRegistered =
        await findUserByEmailService(email);

    if (alreadyRegistered) {
        throw new ConflictError("User already exists");
    }

    if (employeeId) {
        const existingEmployee = await User.findOne({
            employeeId,
        });

        if (existingEmployee) {
            throw new ConflictError(
                "Employee ID already exists",
            );
        }
    }

    const hashedPassword = await bcrypt.hash(
        password,
        10,
    );

    const userCount = await User.countDocuments({});
    const role = userCount === 0 ? "admin" : "employee";

    const user = await User.create({
        name,
        email,
        password: hashedPassword,

        // First registered user gets admin; others default to employee.
        role,

        employeeId,
        jobTitle,
    });

    return user;
};

export const loginUserService = async (
    email,
    password,
) => {
    const user = await findUserByEmailService(email);

    if (!user) {
        throw new UnauthorizedError(
            "Invalid email or password",
        );
    }

    if (!user.isActive) {
        throw new ForbiddenError(
            "Your account has been deactivated",
        );
    }

    const isPasswordMatched = await bcrypt.compare(
        password,
        user.password,
    );

    if (!isPasswordMatched) {
        throw new UnauthorizedError(
            "Invalid email or password",
        );
    }

    return user;
};

export const findUserByEmailService = async (email) => {
    return User.findOne({ email }).select("+password");
};

export const getCurrentUserService = async (
    currUser,
) => {
    const user = await User.findById(currUser.id)
        .select(
            "name email role employeeId jobTitle department isActive",
        )
        .populate("department", "name")
        .lean();

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

export const getUserByIdService = async (id) => {
    const user = await User.findById(id)
        .select("-password")
        .populate("department", "name")
        .lean();

    if (!user) {
        throw new NotFoundError("User not found");
    }

    return user;
};

export const getUsersService = async (
    queryParams,
) => {
    const query = {};

    const page = Math.max(
        Number(queryParams.page) || 1,
        1,
    );

    const limit = Math.min(
        Math.max(Number(queryParams.limit) || 10, 1),
        100,
    );

    const skip = (page - 1) * limit;

    const allowedRoles = [
        "admin",
        "asset_manager",
        "department_head",
        "employee",
    ];

    if (
        queryParams.role &&
        allowedRoles.includes(queryParams.role)
    ) {
        query.role = queryParams.role;
    }

    if (queryParams.department) {
        query.department = queryParams.department;
    }

    if (queryParams.isActive !== undefined) {
        query.isActive =
            queryParams.isActive === "true";
    }

    if (queryParams.search) {
        const search = queryParams.search.trim();

        query.$or = [
            {
                name: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                email: {
                    $regex: search,
                    $options: "i",
                },
            },
            {
                employeeId: {
                    $regex: search,
                    $options: "i",
                },
            },
        ];
    }

    const [users, totalUsers] = await Promise.all([
        User.find(query)
            .select("-password")
            .populate("department", "name")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean(),

        User.countDocuments(query),
    ]);

    return {
        users,

        pagination: {
            page,
            limit,
            total: totalUsers,
            totalPages: Math.ceil(
                totalUsers / limit,
            ),
        },
    };
};

export const updateUserRoleService = async (
    id,
    role,
    department,
    currUser,
) => {
    if (currUser.id === id) {
        throw new ForbiddenError(
            "You cannot change your own role",
        );
    }

    const user = await User.findById(id);

    if (!user) {
        throw new NotFoundError("User not found");
    }

    user.role = role;
    if (department !== undefined) {
        user.department = department || null;
    }

    await user.save();

    return {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        jobTitle: user.jobTitle,
        department: user.department,
        isActive: user.isActive,
    };
};