import sendCode from "./v1/auth/email/send-code";
import verifyCode from "./v1/auth/email/verify";
import me from "./v1/auth/me";
import refreshToken from "./v1/auth/refresh-token";
import register from "./v1/auth/register";
import handleChats from "./v1/chats/handler";
import createLesson from "./v1/courses/[courseId]/lessons/_post";

export type route = {
    path: string;
    handler: any;
};

export const routes: route[] = [
    {
        path: "/v1/auth/email/send-code",
        handler: sendCode,
    },
    {
        path: "/v1/auth/email/verify",
        handler: verifyCode,
    },
    {
        path: "/v1/auth/register",
        handler: register,
    },
    {
        path: "/v1/auth/me",
        handler: me,
    },
    {
        path: "/v1/auth/refresh-token",
        handler: refreshToken,
    },
    {
        path: "/v1/courses/:courseId/lessons",
        handler: createLesson,
    },
    {
        path: "/v1/chats",
        handler: handleChats,
    },
];
