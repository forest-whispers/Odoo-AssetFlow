import { ZodError } from "zod";

import { BadRequestError } from "../utils/error.js";

export const validate = (schema, target = "body") => {
    return (req, res, next) => {
        try {
            schema.parse(req[target]);
            next();
        } catch (err) {
            if (err instanceof ZodError) {
                return next(
                    new BadRequestError(err.issues[0].message),
                );
            }

            next(err);
        }
    };
};