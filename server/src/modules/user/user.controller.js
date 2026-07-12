import jwt from "jsonwebtoken";

import {
    createUserService,
    loginUserService,
    getUserByIdService,
    getCurrentUserService,
    getUsersService,
    updateUserRoleService,
} from "./user.service.js";

import { cookieOptions } from "../../utils/cookies.js";

export const registerUserController = async (req, res, next) => {
    try {
        const {
            name,
            email,
            password,
            employeeId,
            jobTitle,
        } = req.body;

        const user = await createUserService({
            name,
            email,
            password,
            employeeId,
            jobTitle,
        });

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        res
            .cookie(
                "token",
                token,
                cookieOptions(7 * 24 * 60 * 60 * 1000),
            )
            .status(201)
            .json({
                success: true,
                message: "Registration successful",
                data: {
                    role: user.role,
                },
            });
    } catch (error) {
        next(error);
    }
};

export const loginUserController = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await loginUserService(
            email,
            password,
        );

        const token = jwt.sign(
            {
                id: user._id,
                role: user.role,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        res
            .cookie(
                "token",
                token,
                cookieOptions(7 * 24 * 60 * 60 * 1000),
            )
            .status(200)
            .json({
                success: true,
                message: "Login successful",
                data: {
                    role: user.role,
                },
            });
    } catch (error) {
        next(error);
    }
};

export const getCurrentUserController = async (
    req,
    res,
    next,
) => {
    try {
        const user = await getCurrentUserService(req.user);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const getUserController = async (
    req,
    res,
    next,
) => {
    try {
        const { id } = req.params;

        const user = await getUserByIdService(id);

        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const getUsersController = async (
    req,
    res,
    next,
) => {
    try {
        const users = await getUsersService(req.query);

        res.status(200).json({
            success: true,
            data: users,
        });
    } catch (error) {
        next(error);
    }
};

export const updateUserRoleController = async (
    req,
    res,
    next,
) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const user = await updateUserRoleService(
            id,
            role,
            req.user,
        );

        res.status(200).json({
            success: true,
            message: "User role updated successfully",
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

export const logoutUserController = async (
    req,
    res,
    next,
) => {
    try {
        res
            .clearCookie("token", cookieOptions(0))
            .status(200)
            .json({
                success: true,
                message: "Signed out successfully",
                data: null,
            });
    } catch (error) {
        next(error);
    }
};