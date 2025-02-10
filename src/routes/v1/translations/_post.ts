import { Router } from "express";
import { authorize } from "../../../middleware/auth";
import { getTranslation } from "../../../db/redis/ai";

const router = Router();

router.use(authorize as any);

router.post(
    "/v1/translations",
    // @ts-ignore
    async (req, res) => {
        try {
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
