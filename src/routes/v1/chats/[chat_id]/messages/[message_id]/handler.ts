import { NextFunction, Response, Router } from "express";
import { authorize } from "../../../../../../middleware/auth";
import { prisma } from "../../../../../../db/prisma";
import { ExtendedRequest } from "../../../../../../types/request";
import tts from "./tts";
import _delete from "./_delete";

const router = Router({ mergeParams: true });

router.use(authorize as any);

const checkParam = async (
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) => {
    if (req.params.chat_id && req.params.message_id) {
        const chatId = req.params.id;
        const messageId = req.params.message_id;

        // Check for message
        const message = await prisma.aIConversationMessage.findFirst({
            where: {
                id: messageId,
                conversationId: chatId,
            },
            include: {
                conversation: true,
            },
        });

        if (!message) {
            res.status(404).json({
                message: "Message not found",
            });
            return;
        }

        req.chat = message.conversation;
        req.message = message;

        next();
    } else {
        res.status(400).json({
            message: "Chat ID and Message ID are required",
        });
    }
};

router.post(
    "/v1/chats/:chat_id/messages/:message_id/tts",
    checkParam as any,
    tts as any
);
router.delete(
    "/v1/chats/:chat_id/messages/:message_id",
    checkParam as any,
    _delete as any
);

export default router;
