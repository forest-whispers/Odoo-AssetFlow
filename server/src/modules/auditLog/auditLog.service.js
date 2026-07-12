import AuditLog from "./auditLog.model.js";
import {
    formatAuditLog,
} from "../../utils/formatLogs.js";


export const createAuditLogService = async (
    actor,
    action,
    entityType,
    entityId,
    metadata = {},
) => {
    const log = await AuditLog.create({
        actor,
        action,
        entityType,
        entityId,
        metadata,
    });

    return log;
};


export const getAuditLogsService = async (
    queryParams,
) => {
    const page = Math.max(
        Number(queryParams.page) || 1,
        1,
    );

    const limit = Math.min(
        Math.max(
            Number(queryParams.limit) || 10,
            1,
        ),
        100,
    );

    const skip = (page - 1) * limit;

    const query = {};

    if (queryParams.action) {
        query.action = queryParams.action;
    }

    if (queryParams.entityType) {
        query.entityType = queryParams.entityType;
    }

    if (queryParams.actor) {
        query.actor = queryParams.actor;
    }

    const [auditLogs, totalLogs] =
        await Promise.all([
            AuditLog.find(query)
                .populate(
                    "actor",
                    "name role employeeId",
                )
                .sort({
                    createdAt: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            AuditLog.countDocuments(query),
        ]);

    return {
        auditLogs:
            auditLogs.map(formatAuditLog),

        pagination: {
            page,
            limit,
            total: totalLogs,
            totalPages:
                Math.ceil(totalLogs / limit),
        },
    };
};


export const getRecentActivityService = async (
    limit = 5,
) => {
    const safeLimit = Math.min(
        Math.max(Number(limit) || 5, 1),
        50,
    );

    const auditLogs = await AuditLog.find()
        .populate(
            "actor",
            "name role employeeId",
        )
        .sort({
            createdAt: -1,
        })
        .limit(safeLimit)
        .lean();

    return auditLogs.map(formatAuditLog);
};