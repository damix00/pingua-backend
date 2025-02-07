// GET /v1/auth/me
// Returns the user's data, courses, and section data

import { Response, Router } from "express";
import { ExtendedRequest } from "../../../types/request";
import { authorize } from "../../../middleware/auth";
import { toAuthCourse, toAuthUser } from "../../../db/transformators/user";
import { getSectionByLevel } from "../../../db/redis/sections";

const router = Router();

router.use(authorize as any);

router.get(
    "/v1/auth/me",
    // @ts-ignore
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
    }
);
export default router;
