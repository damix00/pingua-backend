import { Response, Router } from "express";
import { authorize } from "../../../../../../middleware/auth";
import { ExtendedRequest } from "../../../../../../types/request";
import { prisma } from "../../../../../../db/prisma";
import { fetchLevelWithUnits } from "../../../../../../db/cms/cms";
import { clamp } from "../../../../../../utils/util";

const router = Router();
router.use(authorize as any);

router.patch(
    "/:courseId/lessons/:lessonId",
    // @ts-ignore
    async (req: ExtendedRequest, res: Response) => {
        try {
            const courseId = req.params.courseId;
            const type = req.body.type;
            const mistakes = req.body.mistakes;

            if (!courseId) {
                return res.status(400).json({
                    message: "Course ID is required",
                });
            }

            const course = req.courses.find((c) => c.id == courseId);

            if (!course) {
                return res.status(404).json({
                    message: "Course not found",
                });
            }

            const lessonId = req.params.lessonId;

            if (!lessonId || !type || isNaN(parseInt(mistakes))) {
                return res.status(400).json({
                    message: "Missing required fields",
                });
            }

            if (type != "story" && type != "questions") {
                return res.status(400).json({
                    message: "Invalid type",
                });
            }

            const sectionCmsData = await fetchLevelWithUnits(
                course.section.level
            );

            const currentUnitData = sectionCmsData?.units.find(
                (unit, index) => (index + 1) * 10 > course.xp
            );

            if (!currentUnitData) {
                return res.status(404).json({
                    message: "No unit found",
                });
            }

            const xpToNextLvl = 10 - (course.xp % 10);

            // const xp = Math.min(xpToNextLvl, Math.max(10 - mistakes, 5));
            const xp = Math.min(
                xpToNextLvl,
                clamp(
                    10 - mistakes,
                    5,
                    currentUnitData?.max_completion_xp || 10
                )
            );

            if (type == "story") {
                const story = await prisma.unitStory.findUnique({
                    where: {
                        id: lessonId,
                    },
                });

                if (!story) {
                    return res.status(404).json({
                        message: "Story not found",
                    });
                }

                if (story.completed) {
                    return res.status(400).json({
                        message: "Story already completed",
                    });
                }

                const updatedStory = await prisma.unitStory.update({
                    where: {
                        id: lessonId,
                    },
                    data: {
                        xp,
                        completed: true,
                    },
                });
            } else {
                const questions = await prisma.unitQuestions.findUnique({
                    where: {
                        id: lessonId,
                    },
                });

                if (!questions) {
                    return res.status(404).json({
                        message: "Questions not found",
                    });
                }

                if (questions.completed) {
                    return res.status(400).json({
                        message: "Questions already completed",
                    });
                }

                const updatedQuestions = await prisma.unitQuestions.update({
                    where: {
                        id: lessonId,
                    },
                    data: {
                        xp,
                        completed: true,
                    },
                });
            }

            await prisma.course.update({
                where: {
                    id: courseId,
                },
                data: {
                    xp: {
                        increment: xp,
                    },
                },
            });

            const result = await prisma.user.update({
                where: {
                    id: req.user.id,
                },
                data: {
                    xp: {
                        set: req.user.xp + xp,
                    },
                },
            });

            res.status(503).json({
                message: "Lesson completed",
                xp,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({
                message: "Internal server error",
            });
        }
    }
);

export default router;
