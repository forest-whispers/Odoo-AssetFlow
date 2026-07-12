import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        action: {
            type: String,
            required: true,
            enum: [
                "asset_created",
                "asset_updated",
                "asset_retired",
                "asset_allocated",
                "asset_returned",
                "asset_transferred",
                "maintenance_requested",
                "maintenance_approved",
                "maintenance_rejected",
                "maintenance_resolved",
                "resource_created",
                "resource_booked",
                "resource_booking_cancelled",
                "resource_booking_completed",
            ],
          },

        entityType: {
            type: String,
            required: true,
            trim: true,
        },

        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },

        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    },
);

const AuditLog = mongoose.model(
    "AuditLog",
    auditLogSchema,
);
export default AuditLog;