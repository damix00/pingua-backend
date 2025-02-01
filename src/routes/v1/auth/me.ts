// GET /v1/auth/me
// Returns the user's data, courses, and section data

import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { authorize } from "../../../middleware/auth";
import { toAuthCourse, toAuthUser } from "../../../db/transformators/user";
import { getSectionByLevel } from "../../../db/redis/sections";
import requireMethod from "../../../middleware/require-method";

export default [
    requireMethod("GET"),
    authorize,
    async (req: ExtendedRequest, res: Response) => {
        const sections = [];

        for (const course of req.courses) {
            const section = await getSectionByLevel(course.level);

            sections.push({
                course_id: course.id,
                ...section,
            });
        }

        res.status(200).json({
            user: toAuthUser(req.user),
            courses: req.courses.map(toAuthCourse),
            section_data: sections,
        });
    },
];
