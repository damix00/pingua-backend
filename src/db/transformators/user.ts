// user transformators:
// This file contains functions that transform the data from the database to the format that the client expects.

import { Course, Section, User } from "@prisma/client";

export function toAuthUser(user: User) {
    // Streak expires after 36 hours of inactivity
    const streak =
        (user.lastStreakUpdate?.getTime() ?? 0) + 36 * 60 * 60 * 1000 >
        Date.now()
            ? user.currentStreak
            : 0;

    return {
        id: user.id,
        avatar: user.avatar,
        username: user.username,
        name: user.name,
        email: user.email,
        xp: user.xp,
        plan: user.plan,
        planExpiresAt: user.planExpiresAt,
        streak: {
            current: streak,
            longest: user.longestStreak,
            lastDate: user.lastStreakUpdate,
        },
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
