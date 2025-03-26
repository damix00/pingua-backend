// GET /v1/courses/:courseId/scenarios/:scenarioId/history
// Get history of all sessions for a scenario

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../../types/request";
import { prisma } from "../../../../../../../db/prisma";
import { getDialogueThemeById } from "../../../../../../../db/redis/sections";
import { transformScenario } from "../../../../../../../db/cms/scenarios";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { courseId, scenarioId } = req.params;

        const offset = req.query.offset || undefined;

        const course = req.courses.find((c) => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const scenarios = await prisma.aIScenario.findMany({
            where: {
                cmsId: scenarioId,
                courseId,
                userId: req.user.id,
            },
            orderBy: {
                createdAt: "desc",
            },
            cursor: offset
                ? {
                      id: offset as string,
                  }
                : undefined,
            take: 20,
            skip: offset ? 1 : 0,
        });

        const cmsScenario = await getDialogueThemeById(scenarioId);

        if (!scenarios || !cmsScenario) {
            return res.status(404).json({
                message: "Scenario not found",
            });
        }

        res.status(200).json({
            sessions: scenarios,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
