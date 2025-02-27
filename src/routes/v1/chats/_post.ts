// POST /v1/chats
// Creates a new AI chat for the user with the given character

import { Response } from "express";
import { authorize } from "../../../middleware/auth";
import { ExtendedRequest } from "../../../types/request";
import { prisma } from "../../../db/prisma";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        if (req.user.plan == "FREE") {
            return res
                .status(402)
                .json({ message: "Upgrade to use this feature" });
        }

        const { character } = req.body;

        if (!character) {
            return res.status(400).json({ error: "Character is required" });
        }

        const exists = await prisma.aIConversation.findFirst({
            where: {
                userId: req.user.id,
                character,
            },
        });

        if (exists) {
            return res.status(409).json({ message: "Chat already exists" });
        }

        const chat = await prisma.aIConversation.create({
            data: {
                character,
                userId: req.user.id,
            },
        });

        res.status(201).json({
            chat: {
                id: chat.id,
                character: chat.character,
                messages: [],
                memories: [],
                lastMessage: null,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
