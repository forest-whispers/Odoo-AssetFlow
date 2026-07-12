import mongoose from "mongoose";

const allocationSchema = new mongoose.Schema(
    {
        asset: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Asset",
            required: true,
            index: true,
        },

        employee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        department: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Department",
            required: true,
            index: true,
        },

        allocatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        allocatedAt: {
            type: Date,
            default: Date.now,
        },

        returnedAt: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: [
                "active",
                "returned",
                "transferred",
            ],
            default: "active",
            index: true,
        },

        notes: {
            type: String,
            trim: true,
            default: null,
        },

        transferredTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Allocation",
            default: null,
        },

        transferredFrom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Allocation",
            default: null,
        },
    },
    {
        timestamps: true,
    },
);

/*
    An asset can have unlimited historical allocations,
    but only ONE active allocation.
*/
allocationSchema.index(
    { asset: 1 },
    {
        unique: true,
        partialFilterExpression: {
            status: "active",
        },
    },
);

const Allocation = mongoose.model(
    "Allocation",
    allocationSchema,
);

export default Allocation;