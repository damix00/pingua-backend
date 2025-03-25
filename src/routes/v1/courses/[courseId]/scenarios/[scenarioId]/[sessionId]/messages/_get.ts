// GET /v1/courses/:courseId/scenarios/:scenarioId/:sessionId/messages
// Get messages for a scenario session

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../../../types/request";
import { prisma } from "../../../../../../../../db/prisma";
import { sendScenarioMessage } from "../../../../../../../../apis/ai/scenarios";
import { getDialogueThemeById } from "../../../../../../../../db/redis/sections";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { courseId, scenarioId, sessionId } = req.params;

        const messageOffset = req.query.offset || undefined;

        const course = req.courses.find((c) => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const scenario = await prisma.aIScenario.findFirst({
            where: {
                id: sessionId,
                cmsId: scenarioId,
                courseId,
                userId: req.user.id,
            },
        });

        const cmsScenario = await getDialogueThemeById(scenarioId);

        if (!scenario || !cmsScenario) {
            return res.status(404).json({
                message: "Scenario not found",
            });
        }

        const messages = await prisma.aIScenarioMessage.findMany({
            where: {
                scenarioId: sessionId,
            },
            orderBy: {
                createdAt: "desc",
            },
            cursor: messageOffset
                ? {
                      id: messageOffset as string,
                  }
                : undefined,
            take: 5,
            skip: messageOffset ? 1 : 0,
        });

        res.status(200).json({
            scenario: {
                ...scenario,
                messages,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
