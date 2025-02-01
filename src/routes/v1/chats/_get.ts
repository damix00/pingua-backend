// GET /v1/chats
// Returns all AI chats for the user

import { Response } from "express";
import { authorize } from "../../../middleware/auth";
import { ExtendedRequest } from "../../../types/request";
import { prisma } from "../../../db/prisma";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const last = req.query.last as string;
        const character = req.query.character as string;

        const data = await prisma.aIConversation.findMany({
            where: {
                userId: req.user.id,
                character: character
                    ? {
                          equals: character,
                      }
                    : undefined,
            },
            orderBy: {
                lastMessageTime: "desc",
            },
            include: {
                messages: {
                    include: {
                        attachments: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                    cursor: last
                        ? {
                              id: last,
                          }
                        : undefined,
                    skip: last ? 1 : 0,
                    take: 20,
                },
                memories: true,
            },
        });

        if (character) {
            if (data.length === 0) {
                return res.status(404).json({ message: "Chat not found" });
            }

            const chat = data[0];

            return res.status(200).json({
                chat: {
                    id: chat.id,
                    character: chat.character,
                    messages: chat.messages,
                    memories: chat.memories,
                    lastMessage: chat.messages[0] || null,
                },
            });
        }

        res.status(200).json({
            chats: data.map((d) => ({
                id: d.id,
                character: d.character,
                messages: d.messages,
                memories: d.memories,
                lastMessage: d.messages[0] || null,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
