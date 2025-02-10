import { Response } from "express";
import { ExtendedRequest } from "../../../../../../types/request";
import { getTts } from "../../../../../../db/redis/ai";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const { chat, message } = req;
        const language = req.query.language as string;

        if (!chat || !message) {
            return res.status(404).send({
                message: "Not found",
            });
        }

        const url = await getTts(message.content, {
            character: chat.character as any,
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
