import crypto from "crypto";

export function getRandomInt(min: number, max: number): number {
    return crypto.randomInt(min, max);
}

export function getRandomFloat(min: number, max: number) {
    let rand = crypto.randomBytes(4).readUInt32BE(0) / 0xffffffff;
    return min + rand * (max - min);
}
