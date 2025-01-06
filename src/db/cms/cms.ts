import config from "../../utils/config";
import { setSection } from "../redis/sections";
import { CMSSection, CMSUnit, transformSection } from "./cms-types";

export async function fetchSections(): Promise<
    (CMSSection & {
        unitCount: number;
    })[]
> {
    const data = await fetch(
        `${config.get("PAYLOAD_URL")}/api/sections?limit=0&depth=0`
    );

    const json = await data.json();

    return json.docs.map((section: any) => ({
        ...transformSection(section),
        unitCount: section.units.docs.length,
    }));
}

export async function fetchSectionByLevel(level: number): Promise<
    | (CMSSection & {
          unitCount: number;
      })
    | null
> {
    const data = await fetch(
        `${config.get("PAYLOAD_URL")}/api/sections?limit=0&depth=0`
    );

    const json = await data.json();

    const section = json.docs.find(
        (section: CMSSection) => section.level === level
    );

    if (!section) {
        return null;
    }

    const parsed = {
        ...transformSection(section),
        unitCount: section.units.docs.length,
    };

    await setSection(parsed);
    return parsed;
}
