import dotenv from "dotenv";

let cfg = false;

function init() {
    if (cfg) {
        return;
    }

    cfg = true;

    dotenv.config();
}

function get(key: string): string {
    init();
    return process.env[key] || "";
}

function getNumber(key: string): number {
    init();
    return parseInt(get(key));
}

function getBoolean(key: string): boolean {
    init();
    return get(key) === "true";
}

const config = {
    init,
    get,
    getNumber,
    getBoolean,
};

export default config;
