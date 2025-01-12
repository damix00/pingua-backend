import OpenAI from "openai";

const openai = new OpenAI();

export default openai;

export async function translate(
    textEn: string,
    language: string
): Promise<string> {
    if (language == "en") {
        return textEn;
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
                content: `You are a translator bot. You will be given English text and you need to translate it to the following language code: "${language}" using the show_translation function.`,
            },
            {
                role: "user",
                content: textEn,
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

    // TODO: Implement this function

    return "";
}
