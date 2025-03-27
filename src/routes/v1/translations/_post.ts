// POST /v1/translations
// Route for translating text from one language to another

import { Router } from "express";
import { authorize } from "../../../middleware/auth";
import { getTranslation } from "../../../db/redis/ai";
import { ExtendedRequest } from "../../../types/request";

const router = Router();

router.use(authorize as any);

router.post(
    "/",
    // @ts-ignore
    async (req: ExtendedRequest, res) => {
        try {
            // The scenarios tab requires translations to be enabled, so we can't check for the user's subscription here

            const { text, fromLanguage, toLanguage } = req.body;

            if (!text || !fromLanguage || !toLanguage) {
                return res.status(400).json({ error: "Bad Request" });
            }

            const translation = await getTranslation(
                text,
                toLanguage,
                "gpt-4o-mini",
                fromLanguage
            );

            return res.json({ translation });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

export default router;
