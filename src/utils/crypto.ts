import crypto from "crypto";

// Returns a cryptographically secure random integer between min and max
export function getRandomInt(min: number, max: number): number {
    return crypto.randomInt(min, max);
}

// Returns a cryptographically secure random float between min and max
export function getRandomFloat(min: number, max: number) {
    let rand = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
    return min + rand * (max - min);
}
