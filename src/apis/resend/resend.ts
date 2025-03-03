import { Resend } from "resend";
import fs from "fs";
import path from "path";
import config from "../../utils/config";

export let resend: Resend;

export function init() {
    resend = new Resend(config.get("RESEND_API_KEY"));
}

// Generate an email template with the provided parameters, from the file
export function generateTemplate(file: string, params: Record<string, string>) {
    const template = fs.readFileSync(
        path.join(__dirname, "../../../emails", file),
        "utf8"
    );

    return template.replace(/{{(.*?)}}/g, (_, key) => params[key.trim()]);
}
