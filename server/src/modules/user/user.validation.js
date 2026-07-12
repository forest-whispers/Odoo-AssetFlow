import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(3, "Name too short"),

    email: z.email("Invalid email"),

    password: z
        .string()
        .min(6, "Password too short"),

    employeeId: z
        .string()
        .trim()
        .min(1, "Employee ID is required")
        .optional(),

    jobTitle: z
        .string()
        .trim()
        .min(2, "Job title too short")
        .optional(),
});

export const loginSchema = z.object({
    email: z.email("Invalid email"),

    password: z
        .string()
        .min(6, "Password too short"),
});

export const updateUserRoleSchema = z.object({
    role: z.enum([
        "admin",
        "asset_manager",
        "department_head",
        "employee",
    ]),
});