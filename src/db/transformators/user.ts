// user transformators:
// This file contains functions that transform the data from the database to the format that the client expects.

import { Course, Section, User } from "@prisma/client";

export function toAuthUser(user: User) {
    // Streak expires after 25 hours of inactivity and if it isn't the same day
    const streak = user.lastStreakUpdate
        ? new Date(user.lastStreakUpdate).getTime() + 25 * 60 * 60 * 1000 >
              Date.now() &&
          new Date(user.lastStreakUpdate).getDate() === new Date().getDate()
            ? user.currentStreak
            : 0
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
