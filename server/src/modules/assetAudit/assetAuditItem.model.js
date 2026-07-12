import mongoose from "mongoose";

const assetAuditItemSchema = new mongoose.Schema(
    {
        audit: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssetAudit",
            required: true,
            index: true,
        },

        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
            index: true,
        },

        expectedLocation: {
            type: String,
            default: null,
            trim: true,
        },

        actualLocation: {
            type: String,
            default: null,
            trim: true,
        },

        verificationStatus: {
            type: String,
            enum: [
                "pending",
                "verified",
                "missing",
                "damaged",
                "location_mismatch",
            ],
            default: "pending",
            index: true,
        },

        notes: {
            type: String,
            trim: true,
            default: null,
        },

        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        verifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

assetAuditItemSchema.index(
    {
        audit: 1,
        asset: 1,
    },
    {
        unique: true,
    },
);

const AssetAuditItem = mongoose.model(
    "AssetAuditItem",
    assetAuditItemSchema,
);

export default AssetAuditItem;