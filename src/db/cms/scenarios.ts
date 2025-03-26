import { AIScenario, Course } from "@prisma/client";
import { CMSDialogueTheme } from "./cms-types";
import { getTranslation } from "../redis/ai";

export async function transformScenario(
    cmsTheme: CMSDialogueTheme,
    userScenarios: AIScenario[],
    course: Course,
    filter: string = "all"
) {
    const found = userScenarios.find(
        (scenario) => scenario.cmsId === cmsTheme.id
    );

    if (filter == "finished" && !found?.completed) {
        return null;
    }

    if (filter == "unfinished" && (found?.completed || !found)) {
        return null;
    }

    if (filter == "not_started" && found) {
        return null;
    }

    const title =
        course.appLanguageCode == "en"
            ? cmsTheme.title
            : await getTranslation(cmsTheme.title, course.appLanguageCode);

    const description =
        course.appLanguageCode == "en"
            ? cmsTheme.description
            : await getTranslation(
                  cmsTheme.description,
                  course.appLanguageCode
              );

    return {
        ...cmsTheme,
        title,
        description,
        session_id: found?.id,
        status: found ? (found.completed ? "finished" : "started") : null,
    };
}

export async function transformScenarios(
    cmsThemes: CMSDialogueTheme[],
    userScenarios: AIScenario[],
    course: Course,
    filter: string = "all"
) {
    return Promise.all(
        cmsThemes.map(async (item) => {
            return await transformScenario(item, userScenarios, course, filter);
        })
    );
}
