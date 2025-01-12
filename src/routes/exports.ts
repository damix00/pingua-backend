import sendCode from "./v1/auth/email/send-code";
import verifyCode from "./v1/auth/email/verify";
import me from "./v1/auth/me";
import refreshToken from "./v1/auth/refresh-token";
import register from "./v1/auth/register";
import createLesson from "./v1/courses/[courseId]/lessons/_post";

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
    {
        path: "/v1/auth/email/verify",
        handler: verifyCode,
        method: "post",
    },
    {
        path: "/v1/auth/register",
        handler: register,
        method: "post",
    },
    {
        path: "/v1/auth/me",
        handler: me,
        method: "get",
    },
    {
        path: "/v1/auth/refresh-token",
        handler: refreshToken,
        method: "post",
    },
    {
        path: "/v1/courses/:courseId/lessons",
        handler: createLesson,
        method: "post",
    },
];
