import { AppSections } from "@prisma/client";

const k = 0.5;

export function getLevel(xp: number) {
    return Math.floor(k * Math.sqrt(xp));
}

export function getLevelXp(level: number) {
    return Math.floor((level / k) ** 2);
}

const courses = [
    null,
    AppSections.GREETINGS, // Hello, Goodbye, etc.
    AppSections.NUMBERS, // How much does this cost?, etc.
    AppSections.FOOD_DRINKS, // What do you want to eat?, etc.
    AppSections.COLORS_SHAPES, // What color is this?, etc.
    AppSections.DIRECTIONS, // Where is the bathroom?, etc.
    AppSections.EMERGENCY, // Help, fire, etc.
    AppSections.FAMILY_FRIENDS, // Who is this?, etc.
    AppSections.OBJECTS, // What is this?, table, room, etc.
    AppSections.DAILY_ROUTINES, // Wake up, brush teeth, etc.
    AppSections.CLOTHING_SHOPPING, // Can I try this on?, etc.
    AppSections.TRANSPORTATION, // How do you get to work?, etc.
    AppSections.WEATHER, // What is the weather like?, etc.
    AppSections.EMOTIONS, // How are you feeling?
    AppSections.SOCIALIZE, // What are you doing this weekend?, etc.
    AppSections.WORK_PROFESSIONS, // What do you do?, I am a teacher, etc.
    AppSections.HOBBIES_FREE_TIME, // What do you do in your free time?, etc.
    AppSections.HEALTH, // Is there a doctor nearby?, etc.
    AppSections.FORMAL, // Dear Sir/Madam, best regards
    AppSections.CULTURAL_EXPRESSIONS, // Break the ice, piece of cake, etc.
    AppSections.SLANG, // What's up?, etc.
];

export function getSection(level: number): AppSections {
    return courses[level] || AppSections.GREETINGS;
}
