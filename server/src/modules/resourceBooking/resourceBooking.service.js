import Resource from "./resource.model.js";
import ResourceBooking from "./resourceBooking.model.js";
import User from  "../user/user.model.js";

import { createAuditLogService } from "../auditLog/auditLog.service.js";

import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../../utils/error.js";


export const createResourceService = async (
    currUser,
    {
        name,
        type,
        description,
        location,
        capacity,
    },
) => {
    const resource = await Resource.create({
        name,
        type,
        description,
        location,
        capacity,
        createdBy: currUser.id,
    });

    await createAuditLogService(
        currUser.id,
        "resource_created",
        "resource",
        resource._id,
        {
            name: resource.name,
            type: resource.type,
        },
    );

    return resource;
};


export const getResourcesService = async (
    queryParams,
) => {
    const query = {
        isActive: true,
    };

    if (
        queryParams.type &&
        [
            "meeting_room",
            "conference_room",
            "projector",
            "vehicle",
            "equipment",
            "other",
        ].includes(queryParams.type)
    ) {
        query.type = queryParams.type;
    }

    if (queryParams.search?.trim()) {
        query.$text = {
            $search: queryParams.search.trim(),
        };
    }

    return Resource.find(query)
        .populate(
            "createdBy",
            "name role",
        )
        .sort({
            name: 1,
        })
        .lean();
};


export const createBookingService = async (
    currUser,
    {
        resource: resourceId,
        purpose,
        startTime,
        endTime,
    },
) => {
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        throw new BadRequestError(
            "Invalid booking date or time",
        );
    }

    if (end <= start) {
        throw new BadRequestError(
            "End time must be after start time",
        );
    }

    if (start <= new Date()) {
        throw new BadRequestError(
            "Resource booking must start in the future",
        );
    }

    const resource = await Resource.findOne({
        _id: resourceId,
        isActive: true,
    })
        .select("name type location")
        .lean();

    if (!resource) {
        throw new NotFoundError(
            "Active resource not found",
        );
    }

    /*
        Two intervals overlap when:

        existing.start < requested.end
                    AND
        existing.end > requested.start
    */
    const conflictingBooking =
        await ResourceBooking.findOne({
            resource: resourceId,
            status: "booked",

            startTime: {
                $lt: end,
            },

            endTime: {
                $gt: start,
            },
        })
            .select(
                "startTime endTime bookedBy",
            )
            .lean();

    if (conflictingBooking) {
        throw new ConflictError(
            "Resource is already booked during the requested time period",
        );
    }

    const user = await User.findById(currUser.id)
        .select("department isActive")
        .lean();

    if (!user || !user.isActive) {
        throw new ForbiddenError(
            "Inactive users cannot book resources",
        );
    }

    const booking =
        await ResourceBooking.create({
            resource: resourceId,
            bookedBy: currUser.id,
            department: user.department || null,
            purpose,
            startTime: start,
            endTime: end,
        });

    await createAuditLogService(
        currUser.id,
        "resource_booked",
        "resource_booking",
        booking._id,
        {
            resource: resource._id,
            resourceName: resource.name,
            startTime: start,
            endTime: end,
        },
    );

    return booking;
};


export const getBookingsService = async (
    currUser,
    queryParams,
) => {
    const query = {};

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

    /*
        Employees see their own bookings.

        Admin and asset managers see all bookings.

        Department heads can see their own bookings
        for now.
    */
    if (
        ["employee", "department_head"].includes(
            currUser.role,
        )
    ) {
        query.bookedBy = currUser.id;
    }

    if (
        queryParams.status &&
        [
            "booked",
            "cancelled",
            "completed",
        ].includes(queryParams.status)
    ) {
        query.status = queryParams.status;
    }

    if (queryParams.resource) {
        query.resource = queryParams.resource;
    }

    const [bookings, totalBookings] =
        await Promise.all([
            ResourceBooking.find(query)
                .populate(
                    "resource",
                    "name type location capacity isActive",
                )
                .populate(
                    "bookedBy",
                    "name email employeeId jobTitle",
                )
                .populate(
                    "department",
                    "name code",
                )
                .sort({
                    startTime: -1,
                })
                .skip(skip)
                .limit(limit)
                .lean(),

            ResourceBooking.countDocuments(query),
        ]);

    return {
        bookings,

        pagination: {
            page,
            limit,
            total: totalBookings,
            totalPages: Math.ceil(
                totalBookings / limit,
            ),
        },
    };
};


export const getBookingService = async (
    currUser,
    bookingId,
) => {
    const booking =
        await ResourceBooking.findById(
            bookingId,
        )
            .populate(
                "resource",
                "name type description location capacity isActive",
            )
            .populate(
                "bookedBy",
                "name email employeeId jobTitle",
            )
            .populate(
                "department",
                "name code",
            )
            .lean();

    if (!booking) {
        throw new NotFoundError(
            "Resource booking not found",
        );
    }

    if (
        ["employee", "department_head"].includes(
            currUser.role,
        ) &&
        booking.bookedBy._id.toString() !==
        currUser.id
    ) {
        throw new ForbiddenError(
            "You cannot access this booking",
        );
    }

    return booking;
};


export const cancelBookingService = async (
    currUser,
    bookingId,
    {
        reason,
    },
) => {
    const booking =
        await ResourceBooking.findById(
            bookingId,
        );

    if (!booking) {
        throw new NotFoundError(
            "Resource booking not found",
        );
    }

    if (booking.status !== "booked") {
        throw new ConflictError(
            `Cannot cancel a booking with status '${booking.status}'`,
        );
    }

    /*
        Regular employees can cancel only
        their own bookings.

        Admin and asset manager may cancel any.
    */
    if (
        !["admin", "asset_manager"].includes(
            currUser.role,
        ) &&
        booking.bookedBy.toString() !==
        currUser.id
    ) {
        throw new ForbiddenError(
            "You cannot cancel this booking",
        );
    }

    /*
        Don't allow cancellation after the booking
        has already started.
    */
    if (booking.startTime <= new Date()) {
        throw new ConflictError(
            "A booking that has already started cannot be cancelled",
        );
    }

    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.cancellationReason =
        reason || null;

    await booking.save();

    await createAuditLogService(
        currUser.id,
        "resource_booking_cancelled",
        "resource_booking",
        booking._id,
        {
            resource: booking.resource,
            bookedBy: booking.bookedBy,
            reason: reason || null,
        },
    );

    return booking;
};


export const completeBookingService = async (
    currUser,
    bookingId,
) => {
    const booking =
        await ResourceBooking.findOneAndUpdate(
            {
                _id: bookingId,
                status: "booked",

                /*
                    Cannot manually complete a booking
                    before its end time.
                */
                endTime: {
                    $lte: new Date(),
                },
            },
            {
                $set: {
                    status: "completed",
                },
            },
            {
                new: true,
                runValidators: true,
            },
        );

    if (!booking) {
        const existing =
            await ResourceBooking.findById(
                bookingId,
            )
                .select(
                    "status endTime",
                )
                .lean();

        if (!existing) {
            throw new NotFoundError(
                "Resource booking not found",
            );
        }

        if (existing.status !== "booked") {
            throw new ConflictError(
                `Cannot complete a booking with status '${existing.status}'`,
            );
        }

        throw new ConflictError(
            "Booking cannot be completed before its scheduled end time",
        );
    }

    await createAuditLogService(
        currUser.id,
        "resource_booking_completed",
        "resource_booking",
        booking._id,
        {
            resource: booking.resource,
            bookedBy: booking.bookedBy,
        },
    );

    return booking;
};