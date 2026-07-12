import express from "express";
import userRoutes from "../modules/user/user.routes.js";
import departmentRouter from "../modules/department/department.routes.js";
import assetCategoryRouter from "../modules/assetCategory/assetCategory.routes.js";
import assetRouter from "../modules/asset/asset.routes.js";
import allocationRouter from "../modules/allocation/allocation.routes.js";
import maintenanceRouter from "../modules/maintenance/maintenance.routes.js";
import resourceBookingRouter from "../modules/resourceBooking/resourceBooking.routes.js";
import dashboardRouter from "../modules/dashboard/dashboard.routes.js";
import analyticsRouter from "../modules/analytics/analytics.routes.js";
import assetAuditRouter from "../modules/assetAudit/assetAudit.routes.js";
import auditLogRouter from "../modules/auditLog/auditLog.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Working",
    });
});

router.use("/users", userRoutes);
router.use("/departments", departmentRouter);
router.use("/asset-categories", assetCategoryRouter);
router.use("/assets", assetRouter);
router.use("/allocations", allocationRouter);
router.use("/maintenance", maintenanceRouter);
router.use("/resource-booking", resourceBookingRouter);
router.use("/dashboard", dashboardRouter);
router.use("/analytics", analyticsRouter);
router.use("/asset-audits", assetAuditRouter);
router.use("/audit-logs", auditLogRouter);

export default router;