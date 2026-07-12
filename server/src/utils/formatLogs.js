export const formatAuditLog = (log) => {
    const actorName = log.actor?.name || "Someone";
    let description = "";
    switch (log.action) {
    }
    return {
        _id: log._id,
        actor: {
            _id: log.actor?._id,
            name: actorName,
            role: log.actor?.role,
        },
        activityType: log.action,
        description,
        entityType: log.entityType,
        entityId: log.entityId,
        timestamp: log.createdAt,
    };
};