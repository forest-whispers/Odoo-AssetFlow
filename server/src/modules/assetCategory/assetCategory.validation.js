import { z } from "zod";

export const createAssetCategorySchema = z.object({
    name: z
        .string()
        .trim()
        .min(
            2,
            "Category name must contain at least 2 characters",
        )
        .max(
            100,
            "Category name cannot exceed 100 characters",
        ),

    code: z
        .string()
        .trim()
        .min(
            2,
            "Category code must contain at least 2 characters",
        )
        .max(
            20,
            "Category code cannot exceed 20 characters",
        )
        .regex(
            /^[A-Za-z0-9_-]+$/,
            "Category code can only contain letters, numbers, hyphens, and underscores",
        ),

    description: z
        .string()
        .trim()
        .max(
            500,
            "Description cannot exceed 500 characters",
        )
        .nullable()
        .optional(),
});

export const updateAssetCategorySchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(
                2,
                "Category name must contain at least 2 characters",
            )
            .max(
                100,
                "Category name cannot exceed 100 characters",
            )
            .optional(),

        code: z
            .string()
            .trim()
            .min(
                2,
                "Category code must contain at least 2 characters",
            )
            .max(
                20,
                "Category code cannot exceed 20 characters",
            )
            .regex(
                /^[A-Za-z0-9_-]+$/,
                "Category code can only contain letters, numbers, hyphens, and underscores",
            )
            .optional(),

        description: z
            .string()
            .trim()
            .max(
                500,
                "Description cannot exceed 500 characters",
            )
            .nullable()
            .optional(),

        isActive: z.boolean().optional(),
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message:
                "At least one field must be provided",
        },
    );