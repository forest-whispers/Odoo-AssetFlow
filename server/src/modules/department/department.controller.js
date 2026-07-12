import {
    createDepartmentService,
    getDepartmentsService,
    getDepartmentByIdService,
    updateDepartmentService,
} from "./department.service.js";

export const createDepartmentController = async (
    req,
    res,
    next,
) => {
    try {
        const department =
            await createDepartmentService(req.body);

        res.status(201).json({
            success: true,
            message:
                "Department created successfully",
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

export const getDepartmentsController = async (
    req,
    res,
    next,
) => {
    try {
        const departments =
            await getDepartmentsService(req.query);

        res.status(200).json({
            success: true,
            data: departments,
        });
    } catch (error) {
        next(error);
    }
};

export const getDepartmentByIdController = async (
    req,
    res,
    next,
) => {
    try {
        const department =
            await getDepartmentByIdService(
                req.params.id,
            );

        res.status(200).json({
            success: true,
            data: department,
        });
    } catch (error) {
        next(error);
    }
};

export const updateDepartmentController = async (
    req,
    res,
    next,
) => {
    try {
        const department =
            await updateDepartmentService(
                req.params.id,
                req.body,
            );

        res.status(200).json({
            success: true,
            message:
                "Department updated successfully",
            data: department,
        });
    } catch (error) {
        next(error);
    }
};