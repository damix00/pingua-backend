import { Router } from "express";
import { authorize } from "../../../middleware/auth";
import { translate } from "../../../apis/ai/openai";

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

            const translation = await translate(text, toLanguage, fromLanguage);

            return res.json({ translation });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Internal Server Error" });
        }
    }
);

export default router;
