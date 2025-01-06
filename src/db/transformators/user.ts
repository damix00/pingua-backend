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

export function toAuthCourse(course: Course & { section: Section }) {
    return {
        id: course.id,
        languageCode: course.languageCode,
        appLanguageCode: course.appLanguageCode,
        xp: course.xp,
        level: course.level,
        fluencyLevel: course.fluencyLevel,
        section: {
            id: course.section.id,
            finished: course.section.finished,
            level: course.section.level,
            accessible: course.section.accessible,
        },
    };
}
