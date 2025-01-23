import { Course, Section } from "@prisma/client";
import { CMSSection, CMSUnit, CMSUnitStory } from "./cms-types";
import { getTranslation, getTts } from "../redis/ai";
import { shuffleArray } from "../../utils/util";

export async function translateDialogue(
    currentUnit: CMSUnit,
    course: Course
): Promise<any[]> {
    if (currentUnit.type != "story") {
        throw new Error("Unit is not a story");
    }

    const appLanguage = course.appLanguageCode;
    const courseLanguage = course.languageCode;

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
                if (courseLanguage == "en") {
                    translation = line.text;
                } else {
                    // Translate it to the course language
                    translation = await getTranslation(
                        line.text,
                        courseLanguage
                    );
                }

                if (appLanguage == "en") {
                    text_app_language = line.text;
                } else {
                    text_app_language = await getTranslation(
                        line.text,
                        appLanguage
                    );
                }

                // And generate TTS audio for it
                audio = await getTts(translation, {
                    character: line.character,
                    language: courseLanguage,
                });
            } else {
                if (appLanguage == "en") {
                    translation = line.text;
                } else {
                    // If the line is a user line, translate it to the app language
                    translation = await getTranslation(line.text, appLanguage);
                }

                // And generate TTS audio for it
                for await (const answer of line.answers) {
                    answers.push({
                        text:
                            appLanguage == "en"
                                ? answer.text
                                : await getTranslation(
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

    return translatedLines;
}
