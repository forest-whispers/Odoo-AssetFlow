import { getAuditLogsService } from "./auditLog.service.js";

export const getAuditLogsController = async (req, res, next) => {
    try {
        const auditLogs = await getAuditLogsService(req.query);
        res.status(200).json({
            success: true,
            data: auditLogs,
        });
    }
    catch (error) {
        next(error);
    }
};