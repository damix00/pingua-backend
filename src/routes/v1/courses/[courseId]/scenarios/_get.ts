import { Response } from "express";
import { ExtendedRequest } from "../../../../../types/request";
import { getDialogueThemes } from "../../../../../db/redis/sections";
import { prisma } from "../../../../../db/prisma";
import { getTranslation } from "../../../../../db/redis/ai";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { courseId } = req.params;

        const course = req.courses.find((c) => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const filter = req.query.filter as string;

        const data = await getDialogueThemes();

        // Add user data: finished, started, not started
        const userId = req.user.id; // Assuming user ID is available in the request
        const scenarios = await prisma.aIScenario.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            distinct: ["cmsId"],
        });

        const result = await Promise.all(
            data.map(async (item) => {
                const found = scenarios.find(
                    (scenario) => scenario.cmsId === item.id
                );

                if (filter == "finished" && !found?.completed) {
                    return null;
                }

                if (filter == "unfinished" && (found?.completed || !found)) {
                    return null;
                }

                if (filter == "not_started" && found) {
                    return null;
                }

                const title =
                    course.appLanguageCode == "en"
                        ? item.title
                        : await getTranslation(
                              item.title,
                              course.appLanguageCode
                          );

                const description =
                    course.appLanguageCode == "en"
                        ? item.description
                        : await getTranslation(
                              item.description,
                              course.appLanguageCode
                          );

                return {
                    ...item,
                    title,
                    description,
                    session_id: found?.id,
                    status: found
                        ? found.completed
                            ? "finished"
                            : "started"
                        : null,
                };
            })
        );

        res.status(200).json({
            data: result.filter((r) => r != null),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
