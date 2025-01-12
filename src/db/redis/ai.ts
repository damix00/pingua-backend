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
    textEn: string,
    translation: string,
    toLanguage: string,
    model: string
) {
    return await redis.set(
        `translation:${toLanguage}:${model}:${textEn}`,
        translation
    );
}

export async function getTranslation(
    textEn: string,
    toLanguage: string,
    model: string = "gpt-4o-mini"
) {
    const cached = await redis.get(
        `translation:${toLanguage}:${model}:${textEn}`
    );

    if (cached) {
        return cached;
    }

    const response = await translate(textEn, toLanguage);

    await setTranslation(textEn, response, toLanguage, model);

    return response;
}
