import { Resend } from "resend";
import fs from "fs";
import path from "path";

export let resend: Resend;

export function init() {
    resend = new Resend(process.env.RESEND_API_KEY);
}

export function generateTemplate(file: string, params: Record<string, string>) {
    const template = fs.readFileSync(
        path.join(__dirname, "../../../emails", file),
        "utf8"
    );

    return template.replace(/{{(.*?)}}/g, (_, key) => params[key.trim()]);
}
