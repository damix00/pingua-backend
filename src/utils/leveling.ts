const k = 0.5;

export function getLevel(xp: number) {
    return Math.floor(k * Math.sqrt(xp));
}

export function getLevelXp(level: number) {
    return Math.floor((level / k) ** 2);
}
