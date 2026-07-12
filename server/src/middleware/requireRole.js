import { ForbiddenError } from "../utils/error.js";

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new ForbiddenError(
                "You do not have permission to access this resource",
            );
        }

        next();
    };
};

export default requireRole;