// POST /v1/chats/[id]/messages
// Send a message to the chat with the given ID

import { Response, Router } from "express";
import { ExtendedRequest } from "../../../../../types/request";
import { prisma } from "../../../../../db/prisma";
import {
    getCharacterSystemMessage,
    sendMessage,
} from "../../../../../apis/ai/openai";
import { sleep } from "../../../../../utils/util";
import OpenAI from "openai";
import { authorize } from "../../../../../middleware/auth";
import { getTts } from "../../../../../db/redis/ai";

const router = Router();

router.use(authorize as any);

router.post(
    "/:id/messages",
    // @ts-ignore
    async (req: ExtendedRequest, res: Response) => {
        try {
            if (req.user.plan == "FREE") {
                return res
                    .status(402)
                    .json({ message: "Upgrade to use this feature" });
            }

            const { id } = req.params;
            const { content, language, should_reason, fluency, auto_tts } =
                req.body;

            // fluceny is a number between 1-4
            if (fluency && (fluency < 1 || fluency > 4)) {
                return res.status(400).json({
                    message: "Fluency must be between 1 and 4",
                });
            }

            if (!content) {
                return res.status(400).json({ error: "Content is required" });
            }

            const chat = await prisma.aIConversation.findUnique({
                where: {
                    id,
                    userId: req.user.id,
                },
            });

            if (!chat) {
                return res.status(404).json({ message: "Chat not found" });
            }

            const lastMessages = await prisma.aIConversationMessage.findMany({
                where: {
                    conversationId: id,
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

            const sent = await prisma.aIConversationMessage.create({
                data: {
                    content,
                    conversationId: id,
                    userMessage: true,
                },
            });

            if (!sent) {
                return res
                    .status(500)
                    .json({ message: "Failed to send message" });
            }

            const response = (await sendMessage(
                [
                    ...lastMessages.map((msg) => ({
                        role: (msg.userMessage ? "user" : "assistant") as any,
                        content: msg.content,
                    })),
                    {
                        role: "user",
                        content,
                    },
                ],
                getCharacterSystemMessage(
                    chat.character as any,
                    language,
                    fluency
                ),
                false,
                should_reason
            )) as OpenAI.Chat.Completions.ChatCompletion;

            const responseContent = response.choices[0].message.content;

            if (!responseContent) {
                return res
                    .status(500)
                    .json({ message: "Failed to get response" });
            }

            // Messages are split using <new-message /> tag
            let messages = responseContent
                .split("<new-message />")
                .map((msg) => msg.trim());

            const dbMessages = [];

            let ttsUrl = null;

            if (auto_tts) {
                // Combine messages
                let combined = "";

                for (const message of messages) {
                    combined += `${message}. `;
                }

                // Generate TTS for the combined message
                ttsUrl = await getTts(combined, {
                    character: chat.character as any,
                    language,
                });
            }

            // Save AI response
            for await (const message of messages) {
                // We don't use saveMany because we want to save the messages in order
                // with saveMany all messages are saved at the same time and the order is not guaranteed
                dbMessages.push(
                    await prisma.aIConversationMessage.create({
                        data: {
                            content: message,
                            conversationId: id,
                            userMessage: false,
                        },
                    })
                );
            }

            res.status(200).json({
                messages: [...dbMessages.reverse(), sent],
                ttsUrl,
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
);

export default router;
