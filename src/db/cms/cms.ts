import config from "../../utils/config";
import { setSection } from "../redis/sections";
import { CMSSection, CMSUnit, transformSection } from "./cms-types";

export async function fetchSections(): Promise<
    (CMSSection & {
        unitCount: number;
        unitTitles: { [key: string]: string }[];
    })[]
> {
    const data = await fetch(
        `${config.get("PAYLOAD_URL")}/api/sections?limit=0&depth=0`
    );

    const json = await data.json();

    return json.docs.map((section: any) => ({
        ...transformSection(section),
        unitCount: section.units.docs.length,
        unitTitles: section.units.docs.map((unit: CMSUnit) => ({
            title: unit.title,
            title_hr: unit.title_hr,
        })),
    }));
}

export async function fetchSectionByLevel(level: number): Promise<
    | (CMSSection & {
          unitCount: number;
          unitTitles: { [key: string]: string }[];
      })
    | null
> {
    const data = await fetch(
        `${config.get("PAYLOAD_URL")}/api/sections?limit=0&depth=1`
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
        unitTitles: section.units.docs
            .sort((a: any, b: any) =>
                new Date(a.createdAt) > new Date(b.createdAt) ? 1 : -1
            )
            .map((unit: CMSUnit) => ({
                title: unit.title,
                title_hr: unit.title_hr,
            })),
    };

    await setSection(parsed);
    return parsed;
}
