import AuditLog from './auditLog.model.js';
import { formatAuditLog } from '../../utils/formatLogs.js';

export const createAuditLogService=async (actor, action, entityType, entityId, metadata={})=>
{
    const log=await AuditLog.create({actor, action, entityType, entityId, metadata});
    return log;
};

export const getAuditLogsService = async (queryParams) => {
    const page = Number(queryParams.page) || 1;
    const limit = Number(queryParams.limit) || 10;
    const skip = (page - 1) * limit;
    const [auditLogs, totalLogs] = await Promise.all([
        AuditLog.find().populate("actor", "name role").sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        AuditLog.countDocuments(),
    ]);
    return {
        auditLogs: auditLogs.map(formatAuditLog),
        pagination: {
            page,
            limit,
            total: totalLogs,
            totalPages: Math.ceil(totalLogs / limit),
        },
    };
};

export const getRecentActivityService = async (limit = 5) => {
    const auditLogs = await AuditLog.find().populate("actor", "name role").sort({ createdAt: -1 }).limit(limit).lean();
    return auditLogs.map(formatAuditLog);
};