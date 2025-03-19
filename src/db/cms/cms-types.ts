// Type definitions for the CMS data

import { shuffleArray } from "../../utils/util";

export enum CMSQuestionType {
    Flashcard = "flashcard",
    MultipleChoice = "multiple-choice",
    ListenAndWrite = "listen-and-write",
    ListenAndChoose = "listen-and-choose",
    RecordVoice = "record-voice",
    Translate = "translate",
}

export enum AppCharacter {
    Penguin = "penguin",
    Fujio = "fujio",
    Jaxon = "jaxon",
    Sara = "sara",
    MrWilliams = "mr-williams",
}

export type CMSDialogueTheme = {
    title: string;
    description: string;
    imageUrl: string;
    aiRole: string;
    aiVoice: string;
    type: "beginner" | "intermediate" | "advanced" | "fluent";
};

export type CMSCharacter = "user" | "narrator" | AppCharacter;

export type CMSUnitStory = {
    id: string;
    title: string;
    dialogue: {
        id: string;
        character: CMSCharacter;
        text: string;
        answers: {
            id: string;
            text: string;
            correct: boolean;
        }[];
    }[];
};

export type CMSQuestionFlashcard = {
    id: string;
    question: string;
    questionType: CMSQuestionType.Flashcard;
    isVariation: false;
    correctAnswer: string;
    character: AppCharacter;
};

export type CMSQuestionMultipleChoice = {
    id: string;
    question: string;
    questionType: CMSQuestionType.MultipleChoice;
    isVariation: false;
    answers: {
        id: string;
        answer: string;
        correct: boolean;
    }[];
    character: AppCharacter;
};

export type CMSQuestionListenAndWrite = {
    id: string;
    question: string;
    questionType: CMSQuestionType.ListenAndWrite;
    audio: string;
    isVariation: false;
    correctAnswer: string;
    character: AppCharacter;
};

export type CMSQuestionListenAndChoose = {
    id: string;
    question: string;
    questionType: CMSQuestionType.ListenAndChoose;
    audio: string;
    isVariation: false;
    answers: {
        id: string;
        answer: string;
        correct: boolean;
    }[];
    character: AppCharacter;
};

export type CMSQuestionRecordVoice = {
    id: string;
    question: string;
    isVariation: false;
    questionType: CMSQuestionType.RecordVoice;
    character: AppCharacter;
};

export type CMSQuestionTranslate = {
    id: string;
    question: string;
    questionType: CMSQuestionType.Translate;
    isVariation: false;
    correctAnswer: string;
    character: AppCharacter;
};

export type CMSQuestion =
    | CMSQuestionMultipleChoice
    | CMSQuestionFlashcard
    | CMSQuestionListenAndWrite
    | CMSQuestionListenAndChoose
    | CMSQuestionRecordVoice
    | CMSQuestionTranslate
    | {
          type: null;
          id: string;
          isVariation: boolean;
          variations: (
              | CMSQuestionMultipleChoice
              | CMSQuestionFlashcard
              | CMSQuestionListenAndWrite
              | CMSQuestionListenAndChoose
              | CMSQuestionRecordVoice
              | CMSQuestionTranslate
          )[];
      };

export type CMSUnit =
    | {
          id: string;
          section: CMSSection;
          type: "story";
          title: string;
          title_hr: string;
          max_completion_xp: number;
          story: CMSUnitStory;
      }
    | {
          id: string;
          section: CMSSection;
          title: string;
          title_hr: string;
          type: "questions";
          max_completion_xp: number;
          questions: CMSQuestion[];
      };

export type CMSSection = {
    id: string;
    title: string;
    title_hr: string;
    level: number;
};

export function transformSection(section: CMSSection): any {
    return {
        id: section.id,
        title: section.title,
        title_hr: section.title_hr,
        level: section.level,
    };
}

export function transformQuestion(question: CMSQuestion): any {
    try {
        if ("isVariation" in question && question.isVariation) {
            return {
                id: question.id,
                isVariation: question.isVariation,
                variations: question.variations.map((variation) =>
                    // @ts-ignore
                    transformQuestion({ ...variation, id: question.id })
                ),
            };
        }

        if ("questionType" in question) {
            switch (question.questionType) {
                case CMSQuestionType.ListenAndChoose:
                case CMSQuestionType.MultipleChoice:
                    return {
                        id: question.id,
                        questionType: question.questionType,
                        question: question.question,
                        answers: shuffleArray(
                            question.answers.map((answer) => ({
                                id: answer.id,
                                answer: answer.answer,
                                correct: answer.correct,
                            }))
                        ),
                    };
                case CMSQuestionType.Flashcard:
                    return {
                        id: question.id,
                        questionType: question.questionType,
                        question: question.question,
                        correctAnswer: question.correctAnswer,
                    };
                case CMSQuestionType.ListenAndWrite:
                    return {
                        id: question.id,
                        questionType: question.questionType,
                        question: question.question,
                        correctAnswer: question.correctAnswer,
                    };
                case CMSQuestionType.RecordVoice:
                    return {
                        id: question.id,
                        questionType: question.questionType,
                        question: question.question,
                    };
                case CMSQuestionType.Translate:
                    return {
                        id: question.id,
                        questionType: question.questionType,
                        question: question.question,
                        correctAnswer: question.correctAnswer,
                    };
            }
        }
    } catch (e) {
        console.error(e);
        console.log(question.id);

        throw e;
    }
}

export function transformUnit(unit: any) {
    if (unit.type === "story") {
        return {
            id: unit.id,
            type: "story",
            title: unit.title,
            title_hr: unit.title_hr,
            max_completion_xp: unit.max_completion_xp,
            story: {
                id: unit.story.id,
                title: unit.story.title,
                dialogue: unit.story.dialogue.map((dialogue: any) => ({
                    id: dialogue.id,
                    character: dialogue.character,
                    text: dialogue.text,
                    answers: dialogue.answers.map((answer: any) => ({
                        id: answer.id,
                        text: answer.text,
                        correct: answer.correct,
                    })),
                })),
            },
        };
    }

    return {
        id: unit.id,
        type: "questions",
        title: unit.title,
        title_hr: unit.title_hr,
        max_completion_xp: unit.max_completion_xp,
        questions: unit.questions.docs.map((question: CMSQuestion) => {
            const t = transformQuestion(question);

            return t;
        }),
    };
}

export function transformUnits(units: any[]): any[] {
    return units.map(transformUnit);
}

export function transformSections(sections: any[]): any[] {
    return sections.map(transformSection);
}
