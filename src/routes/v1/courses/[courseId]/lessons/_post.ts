// POST /v1/courses/:courseId/lessons
// Generate a new lesson for the user, based on the current state (section, unit etc.)

import { Response } from "express";
import { authorize } from "../../../../../middleware/auth";
import { ExtendedRequest } from "../../../../../types/request";
import { fetchLevelWithUnits } from "../../../../../db/cms/cms";
import { getTranslation, getTts } from "../../../../../db/redis/ai";
import { shuffleArray } from "../../../../../utils/util";

export default [
    authorize,
    async (req: ExtendedRequest, res: Response) => {
        try {
            const courseId = req.params.courseId;

            if (!courseId) {
                return res.status(400).json({
                    message: "Course ID is required",
                });
            }

            const course = req.courses.find((c) => c.id == courseId);

            if (!course) {
                return res.status(404).json({
                    message: "Course not found",
                });
            }

            const section = course.section;

            if (!section) {
                return res.status(404).json({
                    message: "Section not found",
                });
            }

            // Generate a new lesson based on the current state
            // Get the current unit for the user's level and XP

            const sectionCmsData = await fetchLevelWithUnits(section.level);

            const currentUnit = sectionCmsData?.units.find(
                (unit, index) => (index + 1) * 10 > course.xp
            );

            if (!currentUnit) {
                return res.status(404).json({
                    message: "No unit found",
                });
            }

            const appLanguage = course.appLanguageCode;
            const courseLanguage = course.languageCode;

            // Translate the unit data
            // The unit data is given in english, so we need to translate it to the course language
            // The translations are cached in Redis, so we don't need to translate them again if they have been translated before
            // This includes the TTS aswell

            // If the unit is a story, translate the dialogue
            if (currentUnit.type == "story") {
                // Generate an empty array of the same length as the dialogue, to store the translated lines
                const translatedLines: any[] = Array.from({
                    length: currentUnit.story.dialogue.length,
                });

                const story = currentUnit.story;

                // Concurrently translate each line of dialogue, and store the result in the translatedLines array
                await Promise.all(
                    story.dialogue.map(async (line, i) => {
                        // Initialize the translation and audio variables

                        let translation: string;
                        let text_app_language: string | null = null;
                        let audio: string | null = null;
                        let answers: {
                            text: string;
                            correct: boolean;
                        }[] = [];

                        // If the line is not a user line (said by a character, not interactive)
                        if (line.character != "user") {
                            // Translate it to the course language
                            translation = await getTranslation(
                                line.text,
                                courseLanguage
                            );

                            text_app_language = await getTranslation(
                                line.text,
                                appLanguage
                            );

                            // And generate TTS audio for it
                            audio = await getTts(translation, {
                                character: line.character,
                                language: courseLanguage,
                            });
                        } else {
                            // If the line is a user line, translate it to the app language
                            translation = await getTranslation(
                                line.text,
                                appLanguage
                            );

                            // And generate TTS audio for it
                            for await (const answer of line.answers) {
                                answers.push({
                                    text: await getTranslation(
                                        answer.text,
                                        appLanguage
                                    ),
                                    correct: answer.correct,
                                });
                            }

                            answers = shuffleArray(answers);
                        }

                        // Store the translated line in the translatedLines array
                        translatedLines[i] = {
                            text: translation,
                            text_app_language,
                            character: line.character,
                            audio,
                            answers,
                        };
                    })
                );

                // Return the translated lines
                return res.status(200).json({
                    type: currentUnit.type,
                    data: {
                        title: story.title,
                        dialogue: translatedLines,
                    },
                });
            }

            const translatedQuestions: any[] = [];

            const questions = currentUnit.questions;

            // Concurrently translate each question, and store the result in the translatedQuestions array
            await Promise.all(questions.map(async (question) => {}));

            res.status(200).json({
                type: currentUnit.type,
                data: translatedQuestions,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Internal server error" });
        }
    },
];
