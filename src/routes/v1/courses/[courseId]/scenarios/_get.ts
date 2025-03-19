import { Response } from "express";
import { ExtendedRequest } from "../../../../../types/request";
import { getDialogueThemes } from "../../../../../db/redis/sections";

export default async (req: ExtendedRequest, res: Response) => {
    try {
        const data = await getDialogueThemes();

        res.status(200).json({
            data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
        });
    }
};
