import { z } from "zod";

export const createAssetAuditSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(3, "Audit name is too short"),

        department: z.string().min(1),

        auditors: z
            .array(z.string().min(1))
            .default([]),

        startDate: z.coerce.date(),

        endDate: z.coerce.date(),
    })
    .refine(
        (data) => data.endDate >= data.startDate,
        {
            message:
                "End date cannot be before start date",
            path: ["endDate"],
        },
    );

export const updateAuditItemSchema = z.object({
    verificationStatus: z.enum([
        "verified",
        "missing",
        "damaged",
        "location_mismatch",
    ]),

    actualLocation: z
        .string()
        .trim()
        .nullable()
        .optional(),

    notes: z
        .string()
        .trim()
        .nullable()
        .optional(),
});