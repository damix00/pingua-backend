import sendCode from "./v1/auth/email/send-code";

export type route = {
    path: string;
    handler: any;
    method:
        | "get"
        | "post"
        | "put"
        | "delete"
        | "patch"
        | "options"
        | "head"
        | "all";
};

export const routes: route[] = [
    {
        path: "/v1/auth/email/send-code",
        handler: sendCode,
        method: "post",
    },
];
