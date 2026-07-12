import jwt from "jsonwebtoken";

import { UnauthorizedError } from "../utils/error.js";

const requireAuth = async (req, res, next) => {
    try {
        const token = req.cookies.token;

        // API testing:
        // const authHeader = req.headers.authorization;
        // const token =
        //     authHeader && authHeader.startsWith("Bearer ")
        //         ? authHeader.split(" ")[1]
        //         : null;

        if (!token) {
            throw new UnauthorizedError(
                "Login required to access this resource",
            );
        }

        const decodedPayload = jwt.verify(
            token,
            process.env.JWT_SECRET,
        );

        req.user = decodedPayload;

        next();
    } catch (error) {
        next(error);
    }
};

export default requireAuth;