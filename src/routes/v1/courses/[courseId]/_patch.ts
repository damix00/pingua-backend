import { Response } from "express";
import { ExtendedRequest } from "../../../../types/request";
import { prisma } from "../../../../db/prisma";
import { toAuthCourse } from "../../../../db/transformators/user";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { app_language } = req.body;

        if (!app_language) {
            return res.status(400).send({
                message: "app_language is required",
            });
        }

        const course = await prisma.course.update({
            where: {
                id: req.params.courseId,
            },
            data: {
                appLanguageCode: app_language,
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
