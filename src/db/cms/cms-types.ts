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

export type CMSQuestionSingleAnswer = {
    id: string;
    question: string;
    type: CMSQuestionType.Flashcard;
    correctAnswer: string;
};

export type CMSQuestion =
    | CMSQuestionMultipleChoice
    | CMSQuestionSingleAnswer
    | {
          id: string;
          isVariation: boolean;
          variations: CMSQuestionMultipleChoice | CMSQuestionSingleAnswer;
      };

export type CMSUnit =
    | {
          id: string;
          section: CMSSection;
          type: "story";
          story: CMSUnitStory;
      }
    | {
          id: string;
          section: CMSSection;
          type: "questions";
          questions: CMSQuestion[];
      };

export type CMSSection = {
    id: string;
    title: string;
    title_hr: string;
    level: number;
};

export function transformSection(section: any): CMSSection {
    return {
        id: section.id,
        title: section.title,
        title_hr: section.title_hr,
        level: section.level,
    };
}

export function transformUnit(unit: any): CMSUnit {
    if (unit.type === "story") {
        return {
            id: unit.id,
            section: transformSection(unit.section),
            type: "story",
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
        questions: unit.questions.map((question: any) => {
            if (question.type === CMSQuestionType.MultipleChoice) {
                return {
                    id: question.id,
                    question: question.question,
                    type: CMSQuestionType.MultipleChoice,
                    answers: question.answers.map((answer: any) => ({
                        id: answer.id,
                        text: answer.text,
                        correct: answer.correct,
                    })),
                };
            }

            return {
                id: question.id,
                question: question.question,
                type: CMSQuestionType.Flashcard,
                correctAnswer: question.correctAnswer,
            };
        }),
    };
}

export function transformUnits(units: any[]): CMSUnit[] {
    return units.map(transformUnit);
}

export function transformSections(sections: any[]): CMSSection[] {
    return sections.map(transformSection);
}
