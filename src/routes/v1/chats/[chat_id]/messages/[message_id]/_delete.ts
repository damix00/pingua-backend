// DELETE /chats/:id/messages/:message_id

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../types/request";
import { prisma } from "../../../../../../db/prisma";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { chat, message } = req;

        if (!chat || !message) {
            return res.status(404).send({
                message: "Not found",
            });
        }

        await prisma.aIConversationMessage.delete({
            where: {
                id: message.id,
            },
        });

        res.status(204).send();
    } catch (e) {
        console.error(e);
        res.status(500).send({
            message: "Internal server error",
        });
    }
};
