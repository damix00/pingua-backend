import { Course } from "@prisma/client";
import {
    CMSQuestion,
    CMSQuestionFlashcard,
    CMSQuestionListenAndChoose,
    CMSQuestionListenAndWrite,
    CMSQuestionMultipleChoice,
    CMSQuestionRecordVoice,
    CMSQuestionTranslate,
    CMSQuestionType,
    CMSUnit,
} from "./cms-types";
import { randomItem, shuffleArray } from "../../utils/util";
import { getTranslation, getTts } from "../redis/ai";

export async function handleQuestion(
    question: CMSQuestion,
    courseLanguage: string,
    appLanguage: string
): Promise<any> {
    if (question.isVariation) {
        // Select random question from variations
        const variation = randomItem(question.variations);

        return await handleQuestion(variation, courseLanguage, appLanguage);
    } else {
        if (!("questionType" in question)) {
            throw new Error("Question type is required");
        }

        let q, translated, audio;

        switch (question.questionType as any as CMSQuestionType) {
            case CMSQuestionType.Flashcard:
                q = question as any as CMSQuestionFlashcard;

                return {
                    id: question.id,
                    type: "flashcard",
                    question: await getTranslation(q.question, courseLanguage),
                    correctAnswer: await getTranslation(
                        q.correctAnswer,
                        appLanguage
                    ),
                };

            case CMSQuestionType.MultipleChoice:
                q = question as any as CMSQuestionMultipleChoice;

                return {
                    id: question.id,
                    type: "multiple-choice",
                    question: await getTranslation(q.question, courseLanguage),
                    answers: await Promise.all(
                        q.answers.map(async (answer) => ({
                            answer: await getTranslation(
                                answer.answer,
                                appLanguage
                            ),
                            correct: answer.correct,
                        }))
                    ),
                };

            case CMSQuestionType.ListenAndWrite:
                q = question as any as CMSQuestionListenAndWrite;

                translated = await getTranslation(q.question, courseLanguage);
                audio = await getTts(translated, {
                    character: q.character ?? "narrator",
                    language: courseLanguage,
                });

                return {
                    id: question.id,
                    type: "listen-and-write",
                    question: translated,
                    audio,
                };

            case CMSQuestionType.ListenAndChoose:
                q = question as any as CMSQuestionListenAndChoose;
                translated = await getTranslation(q.question, courseLanguage);
                audio = await getTts(translated, {
                    character: q.character ?? "narrator",
                    language: courseLanguage,
                });

                return {
                    id: question.id,
                    type: "listen-and-choose",
                    question: translated,
                    audio,
                    answers: await Promise.all(
                        q.answers.map(async (answer) => ({
                            answer: await getTranslation(
                                answer.answer,
                                appLanguage
                            ),
                            correct: answer.correct,
                        }))
                    ),
                };

            case CMSQuestionType.RecordVoice:
                q = question as any as CMSQuestionRecordVoice;
                translated = await getTranslation(q.question, courseLanguage);
                audio = await getTts(translated, {
                    character: q.character ?? "narrator",
                    language: courseLanguage,
                });

                return {
                    id: question.id,
                    type: "record-voice",
                    question: translated,
                    audio,
                };

            case CMSQuestionType.Translate:
                q = question as any as CMSQuestionTranslate;

                return {
                    id: question.id,
                    type: "translate",
                    question: await getTranslation(q.question, courseLanguage),
                };

            default:
                throw new Error("Unsupported question type");
        }
    }
}

export async function translateQuestions(
    currentUnit: CMSUnit,
    course: Course
): Promise<any[]> {
    if (currentUnit.type != "questions") {
        throw new Error("Unit is not a questions unit");
    }

    const translatedQuestions: any[] = Array.from({
        length: currentUnit.questions.length,
    });

    const courseLanguage = course.languageCode;
    const appLanguage = course.appLanguageCode;

    for (let i = 0; i < currentUnit.questions.length; i++) {
        const question = currentUnit.questions[i];
        const translatedQuestion = await handleQuestion(
            question,
            courseLanguage,
            appLanguage
        );

        translatedQuestions[i] = translatedQuestion;
    }

    return translatedQuestions;
}
