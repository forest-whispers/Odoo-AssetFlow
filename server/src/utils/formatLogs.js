export const formatAuditLog = (log) => {
    const actorName = log.actor?.name || "Someone";
    const metadata = log.metadata || {};

    let description = "";

    switch (log.action) {
        case "asset_created":
            description = `${actorName} registered asset ${metadata.assetTag || ""}${metadata.assetName ? ` — ${metadata.assetName}` : ""}`;
            break;

        case "asset_updated":
            description = `${actorName} updated asset ${metadata.assetTag || ""}${metadata.assetName ? ` — ${metadata.assetName}` : ""}`;
            break;

        case "asset_retired":
            description = `${actorName} retired asset ${metadata.assetTag || ""}${metadata.assetName ? ` — ${metadata.assetName}` : ""}`;
            break;

        case "asset_allocated":
            description = `${metadata.assetTag || "Asset"} allocated to ${metadata.employeeName || "an employee"}`;
            break;

        case "asset_returned":
            description = `${metadata.assetTag || "Asset"} returned by ${metadata.employeeName || "an employee"}`;
            break;

        case "asset_transferred":
            description = `${metadata.assetTag || "Asset"} transferred from ${metadata.fromEmployeeName || "one employee"} to ${metadata.toEmployeeName || "another employee"}`;
            break;

        case "maintenance_requested":
            description = `Maintenance requested for ${metadata.assetTag || "an asset"} by ${actorName}`;
            break;

        case "maintenance_approved":
            description = `${actorName} approved maintenance for ${metadata.assetTag || "an asset"}`;
            break;

        case "maintenance_rejected":
            description = `${actorName} rejected maintenance for ${metadata.assetTag || "an asset"}`;
            break;

        case "maintenance_resolved":
            description = `${actorName} resolved maintenance for ${metadata.assetTag || "an asset"}`;
            break;

        case "resource_created":
            description = `${actorName} created resource ${metadata.resourceName || ""}`.trim();
            break;

        case "resource_booked":
            description = `${metadata.resourceName || "Resource"} booked by ${actorName}`;
            break;

        case "resource_booking_cancelled":
            description = `${actorName} cancelled booking for ${metadata.resourceName || "a resource"}`;
            break;

        case "resource_booking_completed":
            description = `Booking completed for ${metadata.resourceName || "a resource"}`;
            break;

        case "asset_audit_created":
            description = `${actorName} created asset audit cycle${metadata.name ? ` — ${metadata.name}` : ""}`;
            break;

        case "asset_audit_started":
            description = `${actorName} started an asset audit cycle covering ${metadata.totalAssets ?? 0} assets`;
            break;

        case "asset_audit_completed":
            description = `${actorName} completed an asset audit cycle — ${metadata.verifiedAssets ?? 0} verified, ${metadata.discrepancyCount ?? 0} discrepancies`;
            break;

        default:
            description = `${actorName} performed ${log.action.replaceAll("_", " ")}`;
    }

    return {
        _id: log._id,

        actor: {
            _id: log.actor?._id,
            name: actorName,
            role: log.actor?.role,
            employeeId: log.actor?.employeeId,
        },

        activityType: log.action,
        description,

        entityType: log.entityType,
        entityId: log.entityId,

        metadata,

        timestamp: log.createdAt,
    };
};