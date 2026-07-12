import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        password: {
            type: String,
            required: true,
            select: false,
        },

        role: {
            type: String,
            enum: [
                "admin",
                "asset_manager",
                "department_head",
                "employee",
            ],
            default: "employee",
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        employeeId: {
            type: String,
            unique: true,
            sparse: true,
            trim: true,
        },

        jobTitle: {
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

const User = mongoose.model("User", userSchema);

export default User;