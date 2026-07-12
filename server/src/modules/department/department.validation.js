import { z } from "zod";

const objectIdSchema = z
    .string()
    .regex(
        /^[0-9a-fA-F]{24}$/,
        "Invalid MongoDB ObjectId",
    );

export const createDepartmentSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Department name must contain at least 2 characters")
        .max(100, "Department name cannot exceed 100 characters"),

    head: objectIdSchema.nullable().optional(),

    parentDepartment: objectIdSchema.nullable().optional(),

    description: z
        .string()
        .trim()
        .max(500, "Description cannot exceed 500 characters")
        .nullable()
        .optional(),
});

export const updateDepartmentSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(2, "Department name must contain at least 2 characters")
            .max(100, "Department name cannot exceed 100 characters")
            .optional(),

        head: objectIdSchema.nullable().optional(),

        parentDepartment: objectIdSchema.nullable().optional(),

        description: z
            .string()
            .trim()
            .max(500, "Description cannot exceed 500 characters")
            .nullable()
            .optional(),

        isActive: z.boolean().optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided",
        },
    );