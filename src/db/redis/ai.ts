import { tts, TTSModel, voiceMap } from "../../apis/ai/elevenlabs";
import { translate } from "../../apis/ai/openai";
import { AppCharacter } from "../cms/cms-types";
import { redis } from "./redis";

// Function to set text-to-speech audio in Redis cache
export async function setTts(text: string, audio: string, voiceId: string) {
    return await redis.set(`tts:${voiceId}:${text}`, audio);
}

// Function to get text-to-speech audio from Redis cache or API
export async function getTts(
    text: string,
    options: {
        character?: AppCharacter | "narrator";
        language?: string;
        model?: TTSModel;
    } = {}
): Promise<string> {
    // Get the voice ID based on the character or use "narrator" by default
    const voiceId = voiceMap[options.character || "narrator"]!.voiceId;

    // Try to get the cached audio from Redis
    const cached = await redis.get(`tts:${voiceId}:${text}`);

    // If the audio is cached, return it
    if (cached) {
        return cached;
    }

    // If the audio is not cached, fetch it from the API
    const response = await tts(text, options);

    // Cache the fetched audio in Redis
    await setTts(text, response, voiceId);

    return response;
}

// Function to set translation in Redis cache
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

// Function to get translation from Redis cache or API
export async function getTranslation(
    text: string,
    toLanguage: string,
    model: string = "gpt-4o-mini",
    fromLanguage: string = "en"
) {
    // Try to get the cached translation from Redis
    const cached = await redis.get(
        `translation:to-${toLanguage}:${model}:text-${text}:from-${fromLanguage}`
    );

    // If the translation is cached, return it
    if (cached) {
        return cached;
    }

    console.log("CACHE MISS", text, cached);

    // If the translation is not cached, fetch it from the API
    const response = await translate(text, toLanguage, fromLanguage);

    // Cache the fetched translation in Redis
    await setTranslation(text, response, toLanguage, model, fromLanguage);

    return response;
}
