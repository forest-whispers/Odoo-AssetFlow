import mongoose from "mongoose";

const resourceSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        type: {
            type: String,
            enum: [
                "meeting_room",
                "conference_room",
                "projector",
                "vehicle",
                "equipment",
                "other",
            ],
            required: true,
            index: true,
        },

        description: {
            type: String,
            trim: true,
            default: null,
        },

        location: {
            type: String,
            trim: true,
            default: null,
        },

        capacity: {
            type: Number,
            min: 1,
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

resourceSchema.index({
    name: "text",
    description: "text",
    location: "text",
});

const Resource = mongoose.model(
    "Resource",
    resourceSchema,
);

export default Resource;