import config from "../../utils/config";
import { AppCharacter } from "../../db/cms/cms-types";
import { uploadFile } from "../supabase/storage";

// An enum to represent ElevenLabs TTS models
export enum TTSModel {
    ElevenTurboV2 = "eleven_turbo_v2_5",
    ElevenMultilingualV2 = "eleven_multilingual_v2",
}

// A mapping from character names to their ElevenLabs voice settings
export const voiceMap: Record<
    AppCharacter | "narrator",
    {
        voiceId: string;
        model: TTSModel;
    }
> = {
    narrator: {
        voiceId: "Bjh5gxvjDIOKaVNd4cq1",
        model: TTSModel.ElevenTurboV2,
    },
    penguin: {
        voiceId: "Xb7hH8MSUJpSbSDYk0k2",
        model: TTSModel.ElevenTurboV2,
    },
    sara: {
        voiceId: "vGQNBgLaiM3EdZtxIiuY",
        model: TTSModel.ElevenTurboV2,
    },
    jaxon: {
        voiceId: "x86DtpnPPuq2BpEiKPRy",
        model: TTSModel.ElevenTurboV2,
    },
    fujio: {
        voiceId: "GBv7mTt0atIp3Br8iCZE",
        model: TTSModel.ElevenTurboV2,
    },
    "mr-williams": {
        voiceId: "IKne3meq5aSn9XLyUdCD",
        model: TTSModel.ElevenTurboV2,
    },
};

// The main TTS function that converts text to speech
export async function tts(
    text: string,
    options: {
        character?: AppCharacter | "narrator";
        language?: string;
        model?: TTSModel;
    } = {}
): Promise<string> {
    // Default the character to 'narrator' if not provided
    const character = options?.character || "narrator";
    // Retrieve the voice settings from the map
    const voice = voiceMap[character];

    // If the voice is not found in the map, throw an error
    if (!voice) {
        throw new Error("Voice not found");
    }

    // Use the specified model or default to the voice's model
    const model = options?.model || voice?.model;

    // Call the ElevenLabs API to generate a voice stream
    const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "xi-api-key": config.get("ELEVENLABS_API_KEY"),
            },
            body: JSON.stringify({
                text,
                output_format: "mp3_44100_192",
                model_id: model,
                voice_settings: {
                    use_speaker_boost: true,
                    stability: 0.5,
                    similarity_boost: 0.8,
                },
                // Language code is not supported for ElevenMultilingualV2
                language_code:
                    model == TTSModel.ElevenMultilingualV2
                        ? undefined
                        : options.language,
            }),
        }
    );

    // If the response is not ok or has no body, throw an error
    if (!response.ok || response.body == null) {
        throw new Error((await response.json()).detail || "Unknown error");
    }

    // Convert the response to an ArrayBuffer containing the audio
    const sound = await response.arrayBuffer();

    // Upload the audio data to storage and get a link
    const upload = await uploadFile(sound, "mp3", "lesson-data", {
        contentType: "audio/mpeg",
        path: "tts",
    });

    // Return the full path of the uploaded file
    return upload;
}
