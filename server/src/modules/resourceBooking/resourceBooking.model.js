import mongoose from "mongoose";

const resourceBookingSchema = new mongoose.Schema(
    {
        resource: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Resource",
            required: true,
            index: true,
        },

        bookedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
            index: true,
        },

        purpose: {
            type: String,
            required: true,
            trim: true,
        },

        startTime: {
            type: Date,
            required: true,
            index: true,
        },

        endTime: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "booked",
                "cancelled",
                "completed",
            ],
            default: "booked",
            index: true,
        },

        cancelledAt: {
            type: Date,
            default: null,
        },

        cancellationReason: {
            type: String,
            trim: true,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

/*
    Supports efficient overlap checks:

    resource + status + time range
*/
resourceBookingSchema.index({
    resource: 1,
    status: 1,
    startTime: 1,
    endTime: 1,
});

const ResourceBooking = mongoose.model(
    "ResourceBooking",
    resourceBookingSchema,
);

export default ResourceBooking;