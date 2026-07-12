import express from "express";
import userRoutes from "../modules/user/user.routes.js";
import departmentRouter from "../modules/department/department.routes.js";
import assetCategoryRouter from "../modules/assetCategory/assetCategory.routes.js";

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

export default router;