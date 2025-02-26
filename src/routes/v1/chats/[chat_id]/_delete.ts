// DELETE /v1/chats/:chat_id

import { Response } from "express";
import { ExtendedRequest } from "../../../../types/request";
import { prisma } from "../../../../db/prisma";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { chat_id } = req.params;

        if (!chat_id) {
            return res.status(400).json({ message: "Chat ID is required" });
        }

        const chat = await prisma.aIConversation.findFirst({
            where: {
                id: chat_id,
                userId: req.user.id,
            },
        });

        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        await prisma.aIConversationMessage.deleteMany({
            where: {
                conversationId: chat_id,
            },
        });

        await prisma.memory.deleteMany({
            where: {
                conversationId: chat_id,
            },
        });

        return res.status(200).json({ message: "Chat deleted" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
