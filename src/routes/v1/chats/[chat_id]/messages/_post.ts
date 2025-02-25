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

const router = Router();

router.post(
    "/:id/messages",
    // @ts-ignore
    async (req: ExtendedRequest, res: Response) => {
        try {
            const { id } = req.params;
            const { content, language } = req.body;

            if (!content) {
                return res.status(400).json({ error: "Content is required" });
            }

            const chat = await prisma.aIConversation.findUnique({
                where: {
                    id,
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
                take: 10,
            });

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
            // Stream AI response
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
                getCharacterSystemMessage(chat.character as any, language),
                false
            )) as OpenAI.Chat.Completions.ChatCompletion;

            const responseContent = response.choices[0].message.content;

            if (!responseContent) {
                return res
                    .status(500)
                    .json({ message: "Failed to get response" });
            }

            // Messages are split using <new-message /> tag
            let messages = responseContent.split("<new-message />");

            const dbMessages = [];

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
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    }
);

export default router;
