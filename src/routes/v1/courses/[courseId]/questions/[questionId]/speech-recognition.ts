// POST /v1/courses/:courseId/questions/:questionId/speech-recognition

import { Response } from "express";
import { ExtendedRequest } from "../../../../../../types/request";
import { getQuestionById } from "../../../../../../db/redis/sections";
import {
    CMSQuestionRecordVoice,
    CMSQuestionType,
} from "../../../../../../db/cms/cms-types";
import { getTranslation } from "../../../../../../db/redis/ai";
import {
    compareTextsAudio,
    transcribeText,
} from "../../../../../../apis/ai/openai";
import fs from "fs";

export default async (req: ExtendedRequest, res: Response) => {
    const { questionId, courseId } = req.params;

    const file: any = req.files?.recording;
    const question = req.query.text as string;

    if (!file || !question) {
        return res.status(400).json({
            message: "Missing required fields",
        });
    }

    const mvPath = `${file.tempFilePath}.${
        file.name.split(".")[file.name.split(".").length - 1]
    }`;

    fs.renameSync(file.tempFilePath, mvPath);

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
                    q.questionType == CMSQuestionType.RecordVoice &&
                    q.question == question
                ) {
                    questionText = q.question;
                    break;
                }
            }
        }
        if (
            "questionType" in questionCms &&
            questionCms.questionType != CMSQuestionType.RecordVoice
        ) {
            return res.status(400).json({
                message: "Invalid question type",
            });
        }

        if (
            "questionType" in questionCms &&
            questionCms.questionType == CMSQuestionType.RecordVoice
        ) {
            questionText = (questionCms as any as CMSQuestionRecordVoice)
                .question;
        }

        if (!questionText) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        // Translate the question to the course language
        const translation = await getTranslation(
            (questionCms as CMSQuestionRecordVoice).question,
            course.languageCode
        );

        if (!translation) {
            return res.status(500).json({
                message: "Failed to translate",
            });
        }

        const fileData = fs.createReadStream(mvPath);

        // Transcribe the text
        const transcription = await transcribeText(fileData);

        if (!transcription) {
            return res.status(500).json({
                message: "Failed to transcribe",
            });
        }

        const similarity = await compareTextsAudio(
            translation,
            transcription.text
        );

        console.log(transcription.text);

        res.status(200).json({
            question: translation,
            transcription: transcription.text,
            similarity: similarity?.is_similar,
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};
