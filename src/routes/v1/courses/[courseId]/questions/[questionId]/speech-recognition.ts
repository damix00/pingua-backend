import { Response } from "express";
import { ExtendedRequest } from "../../../../../../types/request";
import { getQuestionById } from "../../../../../../db/redis/sections";
import {
    CMSQuestionRecordVoice,
    CMSQuestionType,
} from "../../../../../../db/cms/cms-types";
import { getTranslation } from "../../../../../../db/redis/ai";
import { compareTexts, transcribeText } from "../../../../../../apis/ai/openai";
import fs from "fs";

export default async (req: ExtendedRequest, res: Response) => {
    const { questionId, courseId } = req.params;

    const file: any = req.files?.recording;

    if (!file) {
        return res.status(400).json({
            message: "No file uploaded",
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
        const question = await getQuestionById(questionId);

        if (!question) {
            return res.status(404).json({
                message: "Question not found",
            });
        }

        if (
            "type" in question &&
            question.type != CMSQuestionType.RecordVoice
        ) {
            return res.status(400).json({
                message: "Invalid question type",
            });
        }

        // Translate the question to the course language
        const translation = await getTranslation(
            (question as CMSQuestionRecordVoice).question,
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

        const similarity = await compareTexts(translation, transcription.text);

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
