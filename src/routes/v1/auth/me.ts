import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { authorize } from "../../../middleware/auth";
import { toAuthCourse, toAuthUser } from "../../../db/transformators/user";

export default [
    authorize,
    async (req: ExtendedRequest, res: Response) => {
        res.status(200).json({
            user: toAuthUser(req.user),
            courses: req.courses.map(toAuthCourse),
        });
    },
];
