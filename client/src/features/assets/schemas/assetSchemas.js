import { z } from "zod"

const objectIdRegex = /^[0-9a-fA-F]{24}$/

export const assetSchema = z.object({
  assetTag: z
    .string()
    .trim()
    .min(2, "Asset tag must contain at least 2 characters")
    .max(50, "Asset tag cannot exceed 50 characters"),
  name: z
    .string()
    .trim()
    .min(2, "Asset name must contain at least 2 characters")
    .max(100, "Asset name cannot exceed 100 characters"),
  category: z
    .string()
    .regex(objectIdRegex, "Please select a valid category"),
  department: z
    .string()
    .regex(objectIdRegex, "Please select a valid department")
    .optional()
    .or(z.literal(""))
    .or(z.null()),
  serialNumber: z
    .string()
    .trim()
    .max(100, "Serial number cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  condition: z
    .enum(["excellent", "good", "fair", "poor"])
    .default("good"),
  location: z
    .string()
    .trim()
    .max(200, "Location cannot exceed 200 characters")
    .optional()
    .or(z.literal("")),
  purchaseDate: z
    .string()
    .optional()
    .or(z.literal("")),
  purchaseCost: z
    .coerce
    .number()
    .min(0, "Purchase cost cannot be negative")
    .optional()
    .or(z.nan())
    .or(z.null()),
  warrantyExpiry: z
    .string()
    .optional()
    .or(z.literal("")),
  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional()
    .or(z.literal("")),
}).refine((data) => {
  if (!data.purchaseDate || !data.warrantyExpiry) return true
  return new Date(data.warrantyExpiry) >= new Date(data.purchaseDate)
}, {
  message: "Warranty expiry date must be after or equal to the purchase date",
  path: ["warrantyExpiry"],
})
