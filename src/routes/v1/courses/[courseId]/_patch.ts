// PATCH /api/v1/courses/:courseId
// Updates the course's app and course language

import { Response } from "express";
import { ExtendedRequest } from "../../../../types/request";
import { prisma } from "../../../../db/prisma";
import { toAuthCourse } from "../../../../db/transformators/user";
import { isSupportedLanguage } from "../../../../db/languages";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { app_language, course_language } = req.body;

        const course = await prisma.course.update({
            where: {
                id: req.params.courseId,
                userId: req.user.id,
            },
            data: {
                appLanguageCode: isSupportedLanguage(app_language)
                    ? app_language
                    : undefined,
                languageCode: isSupportedLanguage(course_language)
                    ? course_language
                    : undefined,
            },
            include: {
                sections: {
                    where: {
                        finished: false,
                    },
                },
            },
        });

        res.status(200).send({
            message: "Course updated successfully",
            course: toAuthCourse({
                ...course,
                section: course.sections[0],
            }),
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Internal server error",
        });
    }
};
