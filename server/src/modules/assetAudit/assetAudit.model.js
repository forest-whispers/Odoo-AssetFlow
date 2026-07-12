import mongoose from "mongoose";

const assetAuditSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true,
            index: true,
        },

        auditors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        startDate: {
            type: Date,
            required: true,
        },

        endDate: {
            type: Date,
            required: true,
        },

        status: {
            type: String,
            enum: [
                "scheduled",
                "in_progress",
                "completed",
            ],
            default: "scheduled",
            index: true,
        },

        totalAssets: {
            type: Number,
            default: 0,
        },

        verifiedAssets: {
            type: Number,
            default: 0,
        },

        discrepancyCount: {
            type: Number,
            default: 0,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        completedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

assetAuditSchema.index({
    department: 1,
    status: 1,
});

const AssetAudit = mongoose.model(
    "AssetAudit",
    assetAuditSchema,
);

export default AssetAudit;