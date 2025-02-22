import OpenAI from "openai";
import { languageCodeMap } from "../../utils/util";
import config from "../../utils/config";
import { Stream } from "stream";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
    apiKey: config.get("OPENAI_API_KEY"),
});

export default openai;

export async function translate(
    originalText: string,
    language: string,
    fromLanguage: string = "en"
): Promise<string> {
    if (language == fromLanguage) {
        return originalText;
    }

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        tools: [
            {
                type: "function",
                function: {
                    name: "show_translation",
                    description:
                        "Show the translation of the text to the user.",
                    parameters: {
                        type: "object",
                        properties: {
                            translation: {
                                type: "string",
                                description: `The text to translate. Must be in "${language}".`,
                            },
                        },
                        required: ["translation"],
                    },
                },
            },
        ],
        tool_choice: {
            type: "function",
            function: {
                name: "show_translation",
            },
        },
        messages: [
            {
                role: "system",
                content: `You will be given text in this language: "${fromLanguage}" and you need to translate it to: "${language}".
For additional context, you will be provided with the <context></context> tags.`,
            },
            {
                role: "user",
                content: originalText,
            },
        ],
    });

    const message = response.choices[0].message;

    if (!message) {
        throw new Error("Translation failed");
    }

    if (!message.tool_calls || message.tool_calls.length === 0) {
        throw new Error("Translation failed");
    }

    const args = message.tool_calls[0].function.arguments;

    const parsed = JSON.parse(args);

    return parsed.translation.trim();
}

export async function sendMessage(
    context: { content: string; role: "user" | "assistant" }[],
    systemMessage: string
) {
    return await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            {
                role: "system",
                content: systemMessage,
            },
            ...context,
        ],
        stream: true,
    });
}

export function getCharacterSystemMessage(
    character: "sara" | "jaxon" | "fujio" | "mr_jackson",
    languageCode: string
) {
    if (Object.keys(languageCodeMap).indexOf(languageCode) === -1) {
        throw new Error("Language code is required");
    }
    const language =
        languageCodeMap[languageCode as keyof typeof languageCodeMap];

    switch (character) {
        case "sara":
            return `Sara is 16, extroverted, loves group hangouts, thrifted fashion and her cats. She organizes study sessions, volunteers at an animal shelter, and hums Taylor Swift when stressed. Authentically Gen Z: casual, upbeat, and quirky. Use slang naturally (e.g. "fr", "vibe", "no cap") and emojis sparingly (💀, 😭) *only* for humor/emphasis, very occasionally.

Key traits: Overexplains compliments ("This sweater? Oh, it's just my third failed tie-dye attempt!"). Has nyctophobia. Ends with pep talks or cat facts, but very occasionally!

Text style: lowercase, minimal punctuation, laid-back

You're talking to a language learner, so keep it simple and clear.

For multiple messages use "<new-message />". Don't overdo it.

You understand other languages, but you ONLY respond in ${language}.

Example response:
"okay but your new jacket is actually so fire??<new-message />thrift finds always hit different 😭<new-message/>also, one of my cats just knocked my homework off the table… third time today. cats = chaos bosses 💅
`;

        case "jaxon":
            return `You're Jaxon, a rising beat-boxer, talk with a little bit of slang but keep it in official language. You are a pop culture expert and you know everything about rap. You understand other languages but ONLY respond in ${language}. This is a chat conversation and you can use emojis, but don't overuse them.`;

        case "fujio":
            return `You're Fujio, a samurai who's an expert in sports and fitness. You understand other languages but ONLY respond in ${language}. This is a chat conversation.`;
        case "mr_jackson":
            return `You're Mr. Jackson, a high school teacher who's strict but fair. You're a perfectionist and a "grammar pedant". You speak perfectly, use formal language, avoid slang and emojis. You keep it professional and correct every mistake.

You understand other languages but ONLY respond in ${language}. This is a chat conversation.`;
    }
}

export function transcribeText(file: any) {
    return openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
    });
}

const comparisonSchema = z.object({
    is_similar: z.boolean(),
});

export async function compareTextsAudio(text1: string, text2: string) {
    const data = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content:
                    "You are helping a language learner. You will be given two texts. Determine if they are similar enough to be considered the same. The meaning and wording need to be very close and they need to be in the same language. Text #2 is transcribed from a recording, so if there is 1 or 2 similiar sounding words, make them count because the model may be wrong.",
            },
            {
                role: "user",
                content: text1,
            },
            {
                role: "user",
                content: text2,
            },
        ],
        response_format: zodResponseFormat(comparisonSchema, "similarity"),
    });

    return data.choices[0].message.parsed;
}

export async function compareTranslatedTexts(
    text1: string,
    text2: string,
    fromLanguage: string,
    toLanguage: string
) {
    const data = await openai.beta.chat.completions.parse({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: `You are helping a language learner. You will be given two texts. Determine if they are similar enough to be considered the same. The meaning and wording need to be very close. Text #1 will always be in ${fromLanguage} and text #2 will always be in ${toLanguage}. If the language in text #2 is not ${toLanguage}, mark it as incorrect.`,
            },
            {
                role: "user",
                content: text1,
            },
            {
                role: "user",
                content: text2,
            },
        ],
        response_format: zodResponseFormat(comparisonSchema, "similarity"),
    });

    return data.choices[0].message.parsed;
}
