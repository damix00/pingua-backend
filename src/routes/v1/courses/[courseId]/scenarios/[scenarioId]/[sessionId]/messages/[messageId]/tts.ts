// POST /v1/courses/:courseId/scenarios/:scenarioId/:sessionId/messages/:messageId/tts
// Returns a URL to the generated TTS audio file for the message

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../../../../types/request";
import { getTts } from "../../../../../../../../../db/redis/ai";
import { prisma } from "../../../../../../../../../db/prisma";
import { getDialogueThemeById } from "../../../../../../../../../db/redis/sections";
import { AppCharacter } from "../../../../../../../../../db/cms/cms-types";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { sessionId, messageId, scenarioId } = req.params;
        const { language } = req.params;

        const scenarioSession = await prisma.aIScenario.findFirst({
            where: {
                id: sessionId,
                userId: req.user.id,
            },
        });

        const message = await prisma.aIScenarioMessage.findFirst({
            where: {
                id: messageId,
                scenarioId: sessionId,
            },
        });

        const cmsScenario = await getDialogueThemeById(scenarioId);

        if (!scenarioSession || !message) {
            return res.status(404).send({
                message: "Not found",
            });
        }

        const url = await getTts(message.content, {
            character: cmsScenario?.aiVoice as AppCharacter,
            language,
        });

        res.status(200).json({
            url,
        });
    } catch (e) {
        console.error(e);
        res.status(500).send({
            message: "Internal server error",
        });
    }
};
