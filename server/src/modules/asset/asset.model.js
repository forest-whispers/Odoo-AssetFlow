import mongoose from "mongoose";

const assetSchema = new mongoose.Schema(
    {
        assetTag: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        name: {
            type: String,
            required: true,
            trim: true,
        },

        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AssetCategory",
            required: true,
            index: true,
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
            index: true,
        },

        serialNumber: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        status: {
            type: String,
            enum: [
                "available",
                "allocated",
                "maintenance",
                "retired",
            ],
            default: "available",
            index: true,
        },

        condition: {
            type: String,
            enum: [
                "excellent",
                "good",
                "fair",
                "poor",
            ],
            default: "good",
        },

        location: {
            type: String,
            trim: true,
            default: null,
        },

        purchaseDate: {
            type: Date,
            default: null,
        },

        purchaseCost: {
            type: Number,
            min: 0,
            default: null,
        },

        warrantyExpiry: {
            type: Date,
            default: null,
        },

        notes: {
            type: String,
            trim: true,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    },
);

const Asset = mongoose.model("Asset", assetSchema);

export default Asset;