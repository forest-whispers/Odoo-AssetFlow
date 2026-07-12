import mongoose from "mongoose";

const assetCategorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            trim: true,
            uppercase: true,
        },

        description: {
            type: String,
            trim: true,
            default: null,
        },

        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    },
);

assetCategorySchema.index(
    { name: 1 },
    { unique: true },
);

assetCategorySchema.index(
    { code: 1 },
    { unique: true },
);

assetCategorySchema.index({ isActive: 1 });

const AssetCategory = mongoose.model(
    "AssetCategory",
    assetCategorySchema,
);

export default AssetCategory;