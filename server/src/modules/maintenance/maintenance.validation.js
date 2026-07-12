import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId",
);

export const createMaintenanceSchema = z.object({
    asset: objectIdSchema,

    issueType: z
        .enum([
            "hardware",
            "software",
            "damage",
            "performance",
            "preventive",
            "other",
        ])
        .optional(),

    priority: z
        .enum([
            "low",
            "medium",
            "high",
            "critical",
        ])
        .optional(),

    description: z
        .string()
        .trim()
        .min(
            5,
            "Issue description must contain at least 5 characters",
        )
        .max(
            2000,
            "Issue description is too long",
        ),
});

export const rejectMaintenanceSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(
            3,
            "Rejection reason must contain at least 3 characters",
        )
        .max(
            1000,
            "Rejection reason is too long",
        ),
});

export const resolveMaintenanceSchema = z.object({
    resolutionNotes: z
        .string()
        .trim()
        .min(
            3,
            "Resolution notes must contain at least 3 characters",
        )
        .max(
            2000,
            "Resolution notes are too long",
        ),

    condition: z
        .enum([
            "excellent",
            "good",
            "fair",
            "poor",
        ])
        .optional(),
});