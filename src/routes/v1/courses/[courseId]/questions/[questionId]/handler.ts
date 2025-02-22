import { Router } from "express";
import { getQuestionById } from "../../../../../../db/redis/sections";
import speechRecognition from "./speech-recognition";
import { ExtendedRequest } from "../../../../../../types/request";
import checkTranslation from "./check-translation";

const router = Router();

router.get(
    "/:courseId/questions/:questionId",
    // @ts-ignore
    async (req: ExtendedRequest, res) => {
        const { questionId } = req.params;

        const question = await getQuestionById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        res.json(question);
    }
);

router.post(
    "/:courseId/questions/:questionId/speech-recognition",
    speechRecognition as any
);

router.post(
    "/:courseId/questions/:questionId/check-translation",
    checkTranslation as any
);

export default router;
