// POST /v1/courses/:courseId/lessons
// Generate a new lesson for the user, based on the current state (section, unit etc.)

import { Response } from "express";
import { authorize } from "../../../../../middleware/auth";
import { ExtendedRequest } from "../../../../../types/request";
import { fetchLevelWithUnits } from "../../../../../db/cms/cms";
import { translateDialogue } from "../../../../../db/cms/dialogue";
import { translateQuestions } from "../../../../../db/cms/questions";

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

            // Translate the unit data
            // The unit data is given in english, so we need to translate it to the course language
            // The translations are cached in Redis, so we don't need to translate them again if they have been translated before
            // This includes the TTS aswell

            // If the unit is a story, translate the dialogue
            if (currentUnit.type == "story") {
                const story = currentUnit.story;

                // Generate an empty array of the same length as the dialogue, to store the translated lines
                const translatedLines = await translateDialogue(
                    currentUnit,
                    course
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

            const translatedQuestions = await translateQuestions(
                currentUnit,
                course
            );

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
``;
