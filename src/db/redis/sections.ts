import { redis } from "./redis";
import { fetchSectionByLevel } from "../cms/cms";
import { CMSSection, CMSUnit } from "../cms/cms-types";

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
    await redis.set(`section:${section.level}`, JSON.stringify(section));
    await redis.set(`section:${section.id}`, JSON.stringify(section));
}
