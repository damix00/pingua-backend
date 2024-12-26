import dotenv from "dotenv";

function init() {
    dotenv.config();
}

function get(key: string): string {
    return process.env[key] || "";
}

function getNumber(key: string): number {
    return parseInt(get(key));
}

function getBoolean(key: string): boolean {
    return get(key) === "true";
}

const config = {
    init,
    get,
    getNumber,
    getBoolean,
};

export default config;
