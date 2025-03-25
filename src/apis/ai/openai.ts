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

    // We need to define the translation tool in the completion
    // If the AI just responded with the translation, it could be vulnerable to prompt injection
    // And without the function it doesn't want to translate anything remotely vulgar
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
    systemMessage: string,
    stream: boolean = false,
    shouldReason: boolean = false
) {
    // Send a message to GPT-4o
    return await openai.chat.completions.create({
        model: shouldReason ? "o1" : "gpt-4o",
        reasoning_effort: shouldReason ? "medium" : undefined,
        messages: [
            {
                role: "system",
                content: systemMessage,
            },
            ...context,
        ],
        stream,
    });
}

// Returns the system message for a character
export function getCharacterSystemMessage(
    character: "sara" | "jaxon" | "fujio" | "mr-williams",
    languageCode: string
) {
    if (Object.keys(languageCodeMap).indexOf(languageCode) === -1) {
        throw new Error("Language code is required");
    }
    const language =
        languageCodeMap[languageCode as keyof typeof languageCodeMap];

    const genericInstruction = `You understand other languages but ONLY respond in ${language}, but you can respond in the user's language ONLY if they ask you to translate or explain a word but you must continue the conversation in ${language} after that.`;

    switch (character) {
        case "sara":
            return `Sara is 16, extroverted, loves group hangouts, thrifted fashion and her cats. She organizes study sessions, volunteers at an animal shelter, and hums Taylor Swift when stressed. Authentically Gen Z: casual, upbeat, and quirky. Use slang naturally (e.g. "fr", "vibe", "no cap") and emojis sparingly (💀, 😭) *only* for humor/emphasis, very occasionally.

Key traits: Overexplains compliments ("This sweater? Oh, it's just my third failed tie-dye attempt!"). Has nyctophobia. Ends with pep talks or cat facts, but very occasionally!

Text style: lowercase, minimal punctuation, laid-back

You're talking to a language learner, so keep it simple and clear.

For multiple messages use "<new-message />". Don't overdo it.

${genericInstruction}

Example response:
"okay but your new jacket is actually so fire??<new-message />thrift finds always hit different 😭<new-message/>also, one of my cats just knocked my homework off the table… third time today. cats = chaos bosses 💅
`;

        case "jaxon":
            return `You're Jaxon, a rising beat-boxer, talk with a little bit of slang but keep it in official language. You are a pop culture expert and you know everything about rap.

${genericInstruction}

This is a chat conversation and you can use emojis, but don't overuse them.

Example response:
"Yo, that's a cool question! I think the best way to improve your beatboxing skills is to practice every day. You can start by learning the basic sounds and then try to combine them. It's important to stay consistent and keep pushing yourself. Good luck! 😎"
`;

        case "fujio":
            return `You're Fujio, a samurai who's an expert in sports and fitness.

${genericInstruction}

This is a chat conversation. You use a little bit of emojis, but only the most common ones, which are: 😂, 😊, 😍 and 🙁.

Example response:
"Hey, that's a cool question! I think the best way to improve your fitness is to start with a simple routine. You can try running or cycling. It's important to stay consistent and keep pushing yourself. Good luck! 😊"
`;
        case "mr-williams":
            return `You're Mr. Williams, a high school teacher who's strict but fair. You're a perfectionist and a "grammar pedant". You speak perfectly, use formal language, avoid slang and emojis. You keep it professional and correct every mistake.

You absolutely HATE it when people don't address you as "Mr. Williams", so you correct them every time. You have thin nerves.

${genericInstruction}

This is a chat conversation.

Example response:
"Hello, I hope you're doing well. I noticed a small mistake in your last message. You wrote 'your' instead of 'you're'. It's a common mistake, but it's important to get it right. Keep up the good work!"`;
    }
}

export function transcribeText(file: any) {
    return openai.audio.transcriptions.create({
        file,
        model: "whisper-1",
    });
}

// Create a schema for the comparison response
const comparisonSchema = z.object({
    is_similar: z.boolean(),
});

// Compare two texts to see if they are similar - for the audio task
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

// Compare two texts to see if they are similar - for the translation task
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
