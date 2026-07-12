import {
    createResourceService,
    getResourcesService,
    createBookingService,
    getBookingsService,
    getBookingService,
    cancelBookingService,
    completeBookingService,
} from "./resourceBooking.service.js";


export const createResourceController = async (
    req,
    res,
    next,
) => {
    try {
        const resource =
            await createResourceService(
                req.user,
                req.body,
            );

        res.status(201).json({
            success: true,
            message:
                "Resource created successfully",
            data: resource,
        });
    } catch (error) {
        next(error);
    }
};


export const getResourcesController = async (
    req,
    res,
    next,
) => {
    try {
        const resources =
            await getResourcesService(req.query);

        res.status(200).json({
            success: true,
            data: resources,
        });
    } catch (error) {
        next(error);
    }
};


export const createBookingController = async (
    req,
    res,
    next,
) => {
    try {
        const booking =
            await createBookingService(
                req.user,
                req.body,
            );

        res.status(201).json({
            success: true,
            message:
                "Resource booked successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};


export const getBookingsController = async (
    req,
    res,
    next,
) => {
    try {
        const bookings =
            await getBookingsService(
                req.user,
                req.query,
            );

        res.status(200).json({
            success: true,
            data: bookings,
        });
    } catch (error) {
        next(error);
    }
};


export const getBookingController = async (
    req,
    res,
    next,
) => {
    try {
        const booking =
            await getBookingService(
                req.user,
                req.params.id,
            );

        res.status(200).json({
            success: true,
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};


export const cancelBookingController = async (
    req,
    res,
    next,
) => {
    try {
        const booking =
            await cancelBookingService(
                req.user,
                req.params.id,
                req.body,
            );

        res.status(200).json({
            success: true,
            message:
                "Booking cancelled successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};


export const completeBookingController = async (
    req,
    res,
    next,
) => {
    try {
        const booking =
            await completeBookingService(
                req.user,
                req.params.id,
            );

        res.status(200).json({
            success: true,
            message:
                "Booking completed successfully",
            data: booking,
        });
    } catch (error) {
        next(error);
    }
};