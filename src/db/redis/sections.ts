import { EXPIRY_TIME, redis } from "./redis";
import {
    fetchLevelWithUnits,
    fetchQuestionById,
    fetchSectionByLevel,
    fetchSectionCount,
} from "../cms/cms";
import {
    CMSQuestion,
    CMSSection,
    CMSUnit,
    transformQuestion,
} from "../cms/cms-types";

export async function getSectionByLevel(level: number): Promise<
    | (CMSSection & {
          unitCount: number;
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

export async function setSection(section: CMSSection & { unitCount: number }) {
    await redis.set(`section:${section.level}`, JSON.stringify(section), {
        EX: EXPIRY_TIME,
    });
    await redis.set(`section:${section.id}`, JSON.stringify(section), {
        EX: EXPIRY_TIME,
    });
}

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

export async function setLevelWithUnits(
    level: number,
    data: CMSSection & { units: CMSUnit[] }
): Promise<void> {
    await redis.set(`section:${level}:units`, JSON.stringify(data), {
        EX: EXPIRY_TIME,
    });
}

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
