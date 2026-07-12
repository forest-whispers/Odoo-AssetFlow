import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId",
);

const assetFields = {
    assetTag: z
        .string()
        .trim()
        .min(2, "Asset tag is too short")
        .max(50, "Asset tag is too long"),

    name: z
        .string()
        .trim()
        .min(2, "Asset name is too short")
        .max(100, "Asset name is too long"),

    category: objectIdSchema,

    department: objectIdSchema.nullable().optional(),

    serialNumber: z
        .string()
        .trim()
        .max(100, "Serial number is too long")
        .optional(),

    condition: z
        .enum(["excellent", "good", "fair", "poor"])
        .optional(),

    location: z
        .string()
        .trim()
        .max(200, "Location is too long")
        .optional(),

    purchaseDate: z.coerce.date().optional(),

    purchaseCost: z.coerce
        .number()
        .min(0, "Purchase cost cannot be negative")
        .optional(),

    warrantyExpiry: z.coerce.date().optional(),

    notes: z
        .string()
        .trim()
        .max(1000, "Notes are too long")
        .optional(),
};

const validateWarrantyDates = (data) => {
    if (!data.purchaseDate || !data.warrantyExpiry) {
        return true;
    }

    return data.warrantyExpiry >= data.purchaseDate;
};

export const createAssetSchema = z
    .object(assetFields)
    .refine(validateWarrantyDates, {
        message: "Warranty expiry cannot be before purchase date",
        path: ["warrantyExpiry"],
    });

export const updateAssetSchema = z
    .object({
        name: assetFields.name.optional(),
        category: assetFields.category.optional(),
        department: assetFields.department,
        serialNumber: assetFields.serialNumber,
        condition: assetFields.condition,
        location: assetFields.location,
        purchaseDate: assetFields.purchaseDate,
        purchaseCost: assetFields.purchaseCost,
        warrantyExpiry: assetFields.warrantyExpiry,
        notes: assetFields.notes,
    })
    .refine(
        (data) => Object.keys(data).length > 0,
        {
            message: "At least one field must be provided",
        },
    )
    .refine(validateWarrantyDates, {
        message: "Warranty expiry cannot be before purchase date",
        path: ["warrantyExpiry"],
    });