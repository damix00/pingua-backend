import { Course, Section, User } from "@prisma/client";

export function toAuthUser(user: User) {
    return {
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        name: user.name,
        email: user.email,
        xp: user.xp,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
    };
}

export function toAuthCourse(course: Course & { sections: Section[] }) {
    return {
        id: course.id,
        languageCode: course.languageCode,
        appLanguageCode: course.appLanguageCode,
        xp: course.xp,
        level: course.level,
        fluencyLevel: course.fluencyLevel,
        sections: course.sections.map((section) => ({
            id: section.id,
            finished: section.finished,
            level: section.level,
            accessible: section.accessible,
        })),
    };
}
