// POST /v1/courses/:courseId/scenarios/:scenarioId/:sessionId/messages
// Send a message to a scenario session

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../../../types/request";
import { prisma } from "../../../../../../../../db/prisma";
import { sendScenarioMessage } from "../../../../../../../../apis/ai/scenarios";
import { getDialogueThemeById } from "../../../../../../../../db/redis/sections";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { courseId, scenarioId, sessionId } = req.params;
        const { content, use_reasoning } = req.body;

        if (use_reasoning && req.user.plan == "FREE") {
            return res.status(403).json({
                message: "Reasoning is only available for premium users",
            });
        }

        const course = req.courses.find((c) => c.id === courseId);

        if (!course) {
            return res.status(404).json({
                message: "Course not found",
            });
        }

        // Get all scenarios for the course
        const scenario = await prisma.aIScenario.findFirst({
            where: {
                id: sessionId,
                cmsId: scenarioId,
                courseId,
                userId: req.user.id,
            },
        });

        if (!scenario) {
            return res.status(404).json({
                message: "Scenario not found",
            });
        }

        const cmsScenario = await getDialogueThemeById(scenarioId);

        if (!cmsScenario) {
            return res.status(404).json({
                message: "Scenario not found",
            });
        }

        // Selecting assistant messages here because it's a meaningful conversation and
        // it doesn't know when to end the conversation without its own messages
        const lastMessages = await prisma.aIScenarioMessage.findMany({
            where: {
                scenarioId: sessionId,
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        lastMessages.reverse();

        // Limit should be 25000 characters
        const maxCharacterLimit = 25000;

        let characterCnt = 0;
        for (const msg of lastMessages) {
            characterCnt += msg.content.length;
        }

        while (characterCnt > maxCharacterLimit) {
            const lastMsg = lastMessages.pop();
            characterCnt -= lastMsg?.content.length ?? 0;
        }

        const newUserMessage = await prisma.aIScenarioMessage.create({
            data: {
                scenarioId: sessionId,
                content: req.body.content,
                userMessage: true,
            },
        });

        const newAiMessage = await sendScenarioMessage(
            [
                ...lastMessages.map((m) => ({
                    content: m.content,
                    role: m.userMessage
                        ? ("user" as const)
                        : ("assistant" as const),
                })),
                {
                    content: req.body.content,
                    role: "user",
                },
            ],
            cmsScenario,
            course.languageCode,
            use_reasoning
        );

        if (
            !newAiMessage ||
            newAiMessage.content == null ||
            newAiMessage.content == undefined
        ) {
            return res.status(500).json({
                message: "Failed to send message",
            });
        }

        if (newAiMessage.done) {
            await prisma.aIScenario.update({
                where: {
                    id: sessionId,
                },
                data: {
                    completed: true,
                    success: newAiMessage.success,
                },
            });

            res.status(200).json({
                scenario: {
                    ...scenario,
                    messages: [newUserMessage],
                    completed: true,
                    success: newAiMessage.success,
                },
            });

            return;
        }

        const aiMessage = await prisma.aIScenarioMessage.create({
            data: {
                scenarioId: sessionId,
                content: newAiMessage.content,
                userMessage: false,
            },
        });

        res.status(200).json({
            scenario: {
                ...scenario,
                done: false,
                messages: [aiMessage, newUserMessage],
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
