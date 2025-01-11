export enum CMSQuestionType {
    Flashcard = "flashcard",
    MultipleChoice = "multiple-choice",
    ListenAndWrite = "listen-and-write",
    ListenAndChoose = "listen-and-choose",
    RecordVoice = "record-voice",
    Translate = "translate",
}

export type CMSUnitStory = {
    id: string;
    title: string;
    dialogue: {
        id: string;
        character: string;
        text: string;
        answers: {
            id: string;
            text: string;
            correct: string;
        }[];
    }[];
};

export type CMSQuestionFlashcard = {
    id: string;
    question: string;
    type: CMSQuestionType.Flashcard;
    correctAnswer: string;
};

export type CMSQuestionMultipleChoice = {
    id: string;
    question: string;
    type: CMSQuestionType.MultipleChoice;
    answers: {
        id: string;
        text: string;
        correct: boolean;
    }[];
};

export type CMSQuestionListenAndWrite = {
    id: string;
    question: string;
    type: CMSQuestionType.ListenAndWrite;
    audio: string;
    correctAnswer: string;
};

export type CMSQuestionListenAndChoose = {
    id: string;
    question: string;
    type: CMSQuestionType.ListenAndChoose;
    audio: string;
    answers: {
        id: string;
        text: string;
        correct: boolean;
    }[];
};

export type CMSQuestionRecordVoice = {
    id: string;
    question: string;
    type: CMSQuestionType.RecordVoice;
};

export type CMSQuestionTranslate = {
    id: string;
    question: string;
    type: CMSQuestionType.Translate;
    correctAnswer: string;
};

export type CMSQuestion =
    | CMSQuestionMultipleChoice
    | CMSQuestionFlashcard
    | CMSQuestionListenAndWrite
    | CMSQuestionListenAndChoose
    | CMSQuestionRecordVoice
    | CMSQuestionTranslate
    | {
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
    if ("isVariation" in question && question.isVariation) {
        return {
            id: question.id,
            isVariation: question.isVariation,
            variations: question.variations.map((variation) =>
                // @ts-ignore
                transformQuestion(variation)
            ),
        };
    }

    if ("type" in question) {
        switch (question.type) {
            case CMSQuestionType.ListenAndChoose:
            case CMSQuestionType.MultipleChoice:
                return {
                    id: question.id,
                    type: question.type,
                    question: question.question,
                    answers: question.answers.map((answer) => ({
                        id: answer.id,
                        text: answer.text,
                        correct: answer.correct,
                    })),
                };
            case CMSQuestionType.Flashcard:
                return {
                    id: question.id,
                    type: question.type,
                    question: question.question,
                    correctAnswer: question.correctAnswer,
                };
            case CMSQuestionType.ListenAndWrite:
                return {
                    id: question.id,
                    type: question.type,
                    question: question.question,
                    audio: question.audio,
                    correctAnswer: question.correctAnswer,
                };
            case CMSQuestionType.RecordVoice:
                return {
                    id: question.id,
                    type: question.type,
                    question: question.question,
                };
            case CMSQuestionType.Translate:
                return {
                    id: question.id,
                    type: question.type,
                    question: question.question,
                    correctAnswer: question.correctAnswer,
                };
        }
    }
}

export function transformUnit(unit: any) {
    if (unit.type === "story") {
        return {
            id: unit.id,
            section: transformSection(unit.section),
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
        section: transformSection(unit.section),
        type: "questions",
        title: unit.title,
        title_hr: unit.title_hr,
        max_completion_xp: unit.max_completion_xp,
        questions: unit.questions.map((question: CMSQuestion) =>
            transformQuestion(question)
        ),
    };
}

export function transformUnits(units: any[]): any[] {
    return units.map(transformUnit);
}

export function transformSections(sections: any[]): any[] {
    return sections.map(transformSection);
}
