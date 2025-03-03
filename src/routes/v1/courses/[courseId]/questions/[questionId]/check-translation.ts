// POST /v1/courses/:courseId/questions/:questionId/check-translation
// Check if the translation of a question is correct

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../types/request";
import { getQuestionById } from "../../../../../../db/redis/sections";
import {
    CMSQuestionTranslate,
    CMSQuestionType,
} from "../../../../../../db/cms/cms-types";
import { compareTranslatedTexts } from "../../../../../../apis/ai/openai";
import { getTranslation } from "../../../../../../db/redis/ai";

export default async (req: ExtendedRequest, res: Response) => {
    const { questionId, courseId } = req.params;
    const { translation } = req.body;

    const question = req.query.text as string;

    if (!translation || !question) {
        return res.status(400).json({
            message: "No translation provided",
        });
    }

    const course = req.courses.find((c) => c.id === courseId);

    if (!course) {
        return res.status(404).json({
            message: "Course not found",
        });
    }

    try {
        const questionCms = await getQuestionById(questionId);
        let questionText = "";

        if (!questionCms) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        if (questionCms?.isVariation) {
            for (const q of questionCms.variations) {
                if (
                    "questionType" in q &&
                    q.questionType == CMSQuestionType.Translate &&
                    (await getTranslation(q.question, course.languageCode)) ==
                        question
                ) {
                    questionText = q.question;
                    break;
                }
            }

            if (questionText.length == 0) {
                return res.status(404).json({
                    message: "Question not found",
                });
            }
        }
        if (
            "questionType" in questionCms &&
            questionCms.questionType != CMSQuestionType.Translate
        ) {
            console.log("Invalid question type", questionCms.questionType);

            return res.status(400).json({
                message: "Invalid question type",
            });
        }

        if (
            "questionType" in questionCms &&
            questionCms.questionType == CMSQuestionType.Translate
        ) {
            questionText = (questionCms as any as CMSQuestionTranslate)
                .question;
        }

        if (!questionText) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        const result = await compareTranslatedTexts(
            questionText,
            req.body.translation,
            "en",
            course.appLanguageCode
        );

        let translation = questionText;

        if (!result?.is_similar && course.appLanguageCode != "en") {
            translation = await getTranslation(
                questionText,
                course.appLanguageCode,
                "gpt-4o-mini",
                "en"
            );
        }

        res.status(200).json({
            similarity: result?.is_similar,
            translation: result?.is_similar ? undefined : translation,
        });
    } catch (error) {
        console.error("Failed to get question", error);
        return res.status(500).json({
            message: "Failed to get question",
        });
    }
};
