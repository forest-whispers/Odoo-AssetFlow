import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
    {
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
            index: true,
        },

        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        issueType: {
            type: String,
            enum: [
                "hardware",
                "software",
                "damage",
                "performance",
                "preventive",
                "other",
            ],
            default: "other",
        },

        priority: {
            type: String,
            enum: [
                "low",
                "medium",
                "high",
                "critical",
            ],
            default: "medium",
            index: true,
        },

        description: {
            type: String,
            required: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "pending",
                "in_progress",
                "resolved",
                "rejected",
            ],
            default: "pending",
            index: true,
        },

        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        reviewedAt: {
            type: Date,
            default: null,
        },

        resolutionNotes: {
            type: String,
            trim: true,
            default: null,
        },

        resolvedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        resolvedAt: {
            type: Date,
            default: null,
        },

        rejectionReason: {
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
    Prevent multiple unresolved maintenance requests
    for the same asset.
*/
maintenanceSchema.index(
    { asset: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: {
                $in: ["pending", "in_progress"],
            },
        },
    },
);

const Maintenance = mongoose.model(
    "Maintenance",
    maintenanceSchema,
);

export default Maintenance;