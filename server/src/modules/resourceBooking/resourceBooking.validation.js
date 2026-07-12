import { z } from "zod";

const objectIdSchema = z.string().regex(
    /^[0-9a-fA-F]{24}$/,
    "Invalid MongoDB ObjectId",
);

export const createResourceSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Resource name is too short")
        .max(100),

    type: z.enum([
        "meeting_room",
        "conference_room",
        "projector",
        "vehicle",
        "equipment",
        "other",
    ]),

    description: z
        .string()
        .trim()
        .max(1000)
        .optional(),

    location: z
        .string()
        .trim()
        .max(200)
        .optional(),

    capacity: z
        .number()
        .int()
        .positive()
        .optional(),
});


export const createBookingSchema = z
    .object({
        resource: objectIdSchema,

        purpose: z
            .string()
            .trim()
            .min(
                3,
                "Booking purpose is too short",
            )
            .max(500),

        startTime: z.coerce.date(),

        endTime: z.coerce.date(),
    })
    .refine(
        (data) => data.endTime > data.startTime,
        {
            message:
                "End time must be after start time",
            path: ["endTime"],
        },
    );


export const cancelBookingSchema = z.object({
    reason: z
        .string()
        .trim()
        .min(
            3,
            "Cancellation reason is too short",
        )
        .max(500)
        .optional(),
});