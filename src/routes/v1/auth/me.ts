// GET /v1/auth/me
// Returns the user's data, courses, and section data

import { Response, Router } from "express";
import { ExtendedRequest } from "../../../types/request";
import { authorize } from "../../../middleware/auth";
import { toAuthCourse, toAuthUser } from "../../../db/transformators/user";
import { getSectionByLevel, getSectionCount } from "../../../db/redis/sections";
import { getTranslation } from "../../../db/redis/ai";

const router = Router();

router.use(authorize as any);

router.get(
    "/me",
    // @ts-ignore
    async (req: ExtendedRequest, res: Response) => {
        const sections = [];

        for (const course of req.courses) {
            const section = await getSectionByLevel(course.level);

            let titles = [];

            for (const title of section?.unitTitles ?? []) {
                titles.push({
                    ...title,
                    title:
                        course.appLanguageCode == "en"
                            ? title.title
                            : await getTranslation(
                                  title.title,
                                  course.appLanguageCode
                              ),
                });
            }

            sections.push({
                ...section,
                unitTitles: titles,
                course_id: course.id,
                title:
                    course.appLanguageCode == "en"
                        ? section?.title
                        : await getTranslation(
                              section?.title ?? "",
                              course.appLanguageCode
                          ),
            });
        }

        res.status(200).json({
            user: toAuthUser(req.user),
            courses: req.courses.map(toAuthCourse),
            section_data: sections,
            section_count: await getSectionCount(),
        });
    }
);
export default router;
