import express from "express";
import userRoutes from "../modules/user/user.routes.js";
import departmentRouter from "../modules/department/department.routes.js";

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        success: true,
        message: "API Working",
    });
});

router.use("/users", userRoutes);
router.use("/departments", departmentRouter);

export default router;