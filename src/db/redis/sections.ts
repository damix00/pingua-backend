import { EXPIRY_TIME, redis } from "./redis";
import {
    fetchDialogueThemes,
    fetchLevelWithUnits,
    fetchQuestionById,
    fetchSectionByLevel,
    fetchSectionCount,
} from "../cms/cms";
import {
    CMSDialogueTheme,
    CMSQuestion,
    CMSSection,
    CMSUnit,
    transformQuestion,
} from "../cms/cms-types";

// Fetch a section by its level from Redis cache or CMS if not found in cache
export async function getSectionByLevel(level: number): Promise<
    | (CMSSection & {
          unitCount: number;
          unitTitles: { [key: string]: string }[];
      })
    | null
> {
    const data = await redis.get(`section:${level}`);

    if (data) {
        return JSON.parse(data);
    }

    const result = await fetchSectionByLevel(level);

    return result;
}

// Set a section in Redis cache with an expiry time
export async function setSection(section: CMSSection & { unitCount: number }) {
    await redis.set(`section:${section.level}`, JSON.stringify(section), {
        EX: EXPIRY_TIME,
    });
    await redis.set(`section:${section.id}`, JSON.stringify(section), {
        EX: EXPIRY_TIME,
    });
}

// Fetch a level with its units from Redis cache or CMS if not found in cache
export async function getLevelWithUnits(level: number): Promise<
    | (CMSSection & {
          units: CMSUnit[];
      })
    | null
> {
    const data = await redis.get(`section:${level}:units`);

    if (data) {
        return JSON.parse(data);
    }

    const result = await fetchLevelWithUnits(level);

    if (!result) {
        return null;
    }

    return result;
}

// Set a level with its units in Redis cache with an expiry time
export async function setLevelWithUnits(
    level: number,
    data: CMSSection & { units: CMSUnit[] }
): Promise<void> {
    await redis.set(`section:${level}:units`, JSON.stringify(data), {
        EX: EXPIRY_TIME,
    });
}

// Fetch a question by its ID from Redis cache or CMS if not found in cache
export async function getQuestionById(id: string): Promise<CMSQuestion | null> {
    const data = await redis.get(`question:${id}`);

    if (data) {
        return JSON.parse(data);
    }

    const result = await fetchQuestionById(id);

    if (!result) {
        return null;
    }

    return transformQuestion(result as any);
}

// Fetch the count of sections from Redis cache or CMS if not found in cache
export async function getSectionCount(): Promise<number> {
    const data = await redis.get("section:count");

    if (data) {
        return parseInt(data);
    }

    const result = await fetchSectionCount();

    if (!result) {
        return 1;
    }

    return result;
}

// Set dialogue themes in Redis cache with an expiry time
export async function setDialogueThemes(
    themes: CMSDialogueTheme[]
): Promise<void> {
    await redis.set("dialogue-themes", JSON.stringify(themes), {
        EX: EXPIRY_TIME,
    });
}

// Get dialogue themes
export async function getDialogueThemes(): Promise<CMSDialogueTheme[]> {
    const data = await redis.get("dialogue-themes");

    if (data) {
        return JSON.parse(data);
    }

    const result = await fetchDialogueThemes();

    if (!result) {
        return [];
    }

    await setDialogueThemes(result);

    return result;
}

export async function getDialogueThemeById(
    id: string
): Promise<CMSDialogueTheme | null> {
    const themes = await getDialogueThemes();

    return themes.find((theme) => theme.id === id) || null;
}
