import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        head: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        parentDepartment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
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

departmentSchema.index({ name: 1 }, { unique: true });
departmentSchema.index({ head: 1 });
departmentSchema.index({ parentDepartment: 1 });
departmentSchema.index({ isActive: 1 });

const Department = mongoose.model(
    "Department",
    departmentSchema,
);

export default Department;