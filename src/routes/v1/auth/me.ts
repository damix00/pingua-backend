import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { authorize } from "../../../middleware/auth";
import { toAuthCourse, toAuthUser } from "../../../db/transformators/user";
import { getSectionByLevel } from "../../../db/redis/sections";

export default [
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
