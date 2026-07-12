import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId",
);

export const createAllocationSchema = z.object({
    asset: objectIdSchema,

    employee: objectIdSchema,

    notes: z
        .string()
        .trim()
        .max(1000, "Notes are too long")
        .optional(),
});

export const returnAssetSchema = z.object({
    condition: z
        .enum([
            "excellent",
            "good",
            "fair",
            "poor",
        ])
        .optional(),

    notes: z
        .string()
        .trim()
        .max(1000, "Notes are too long")
        .optional(),
});

export const transferAssetSchema = z.object({
    employee: objectIdSchema,

    notes: z
        .string()
        .trim()
        .max(1000, "Notes are too long")
        .optional(),
});