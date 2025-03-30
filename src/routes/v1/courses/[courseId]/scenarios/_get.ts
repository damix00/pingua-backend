// GET /v1/courses/:courseId/scenarios
// Get all scenarios for a course

import { Response } from "express";
import { ExtendedRequest } from "../../../../../types/request";
import { getDialogueThemes } from "../../../../../db/redis/sections";
import { prisma } from "../../../../../db/prisma";
import { getTranslation } from "../../../../../db/redis/ai";
import { transformScenarios } from "../../../../../db/cms/scenarios";

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
            orderBy: [
                {
                    completed: "asc", // false first
                },
                { createdAt: "desc" },
            ],
            distinct: ["cmsId"],
        });

        const result = await transformScenarios(
            data,
            scenarios,
            course,
            filter
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
