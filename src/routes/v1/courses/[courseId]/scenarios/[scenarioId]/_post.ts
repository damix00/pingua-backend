// POST /v1/courses/:courseId/scenarios/:scenarioId
// Create a new scenario session for the user

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../types/request";
import { prisma } from "../../../../../../db/prisma";
import { getDialogueThemeById } from "../../../../../../db/redis/sections";
import { sendScenarioMessage } from "../../../../../../apis/ai/scenarios";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { courseId, scenarioId } = req.params;

        const course = req.courses.find((c) => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        const scenario = await getDialogueThemeById(scenarioId);

        if (!scenario) {
            return res.status(404).json({
                message: "Scenario not found",
            });
        }

        // Create a new scenario session for the user
        const newScenario = await prisma.aIScenario.create({
            data: {
                userId: req.user.id,
                cmsId: scenario.id,
                courseId: course.id,
            },
        });

        // Generate an initial AI message for the scenario
        const msg = await sendScenarioMessage(
            [],
            scenario,
            course.languageCode,
            false
        );

        if (!msg || !msg.content) {
            return res.status(500).json({
                message: "AI response failed",
            });
        }

        await prisma.aIScenarioMessage.create({
            data: {
                scenarioId: newScenario.id,
                content: msg.content,
                userMessage: false,
            },
        });

        res.status(200).json({
            scenario: newScenario,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
