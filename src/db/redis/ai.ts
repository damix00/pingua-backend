import { tts, TTSModel, voiceMap } from "../../apis/ai/elevenlabs";
import { translate } from "../../apis/ai/openai";
import { AppCharacter } from "../cms/cms-types";
import { redis } from "./redis";

export async function setTts(text: string, audio: string, voiceId: string) {
    return await redis.set(`tts:${voiceId}:${text}`, audio);
}

export async function getTts(
    text: string,
    options: {
        character?: AppCharacter | "narrator";
        language?: string;
        model?: TTSModel;
    } = {}
): Promise<string> {
    const voiceId = voiceMap[options.character || "narrator"]!.voiceId;

    const cached = await redis.get(`tts:${voiceId}:${text}`);

    if (cached) {
        return cached;
    }

    const response = await tts(text, options);

    await setTts(text, response, voiceId);

    return response;
}

export async function setTranslation(
    text: string,
    translation: string,
    toLanguage: string,
    model: string,
    fromLanguage: string = "en"
) {
    return await redis.set(
        `translation:to-${toLanguage}:${model}:text-${text}:from-${fromLanguage}`,
        translation
    );
}

export async function getTranslation(
    text: string,
    toLanguage: string,
    model: string = "gpt-4o-mini",
    fromLanguage: string = "en"
) {
    const cached = await redis.get(
        `translation:to-${toLanguage}:${model}:text-${text}:from-${fromLanguage}`
    );

    if (cached) {
        return cached;
    }

    console.log("CACHE MISS", text, cached);

    const response = await translate(text, toLanguage, fromLanguage);

    await setTranslation(text, response, toLanguage, model, fromLanguage);

    return response;
}
