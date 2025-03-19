import config from "../../utils/config";
import { getSectionByLevel, setSection } from "../redis/sections";
import {
    CMSDialogueTheme,
    CMSSection,
    CMSUnit,
    transformSection,
    transformUnits,
} from "./cms-types";

// Fetch all sections with additional unit count and titles
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

// Fetch a section by its level with additional unit count and titles
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

// Fetch a section by its level along with its units
export async function fetchLevelWithUnits(level: number): Promise<
    | (CMSSection & {
          units: CMSUnit[];
      })
    | null
> {
    const data = await getSectionByLevel(level);

    if (!data) {
        return null;
    }

    const section = await fetch(
        `${config.get("PAYLOAD_URL")}/api/units?section%5Bequals%5D=${
            data.id
        }&sort=createdAt&limit=0`
    );

    if (!section.ok) {
        return null;
    }

    const json = await section.json();

    return {
        ...transformSection(data),
        units: transformUnits(
            json.docs.filter((doc: any) => doc.section.level == level)
        ),
    };
}

// Fetch a question by its ID
export async function fetchQuestionById(id: string): Promise<CMSUnit> {
    const data = await fetch(
        `${config.get("PAYLOAD_URL")}/api/questions/${id}`
    );

    const json = await data.json();

    return json;
}

// Fetch the total count of sections
export async function fetchSectionCount(): Promise<number> {
    const data = await fetch(
        `${config.get("PAYLOAD_URL")}/api/sections?limit=0`
    );

    const json = await data.json();

    return json.docs.length;
}

// Fetch dialogue themes
export async function fetchDialogueThemes(): Promise<CMSDialogueTheme[]> {
    const data = await fetch(
        `${config.get(
            "PAYLOAD_URL"
        )}/api/dialogue-themes?limit=0&sort=createdAt`
    );

    const json = await data.json();

    return json.docs;
}
