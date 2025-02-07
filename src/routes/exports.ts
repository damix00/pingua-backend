import { Router } from "express";
import sendCode from "./v1/auth/email/send-code";
import verifyCode from "./v1/auth/email/verify";
import me from "./v1/auth/me";
import refreshToken from "./v1/auth/refresh-token";
import register from "./v1/auth/register";
import sendMessage from "./v1/chats/[id]/messages/_post";
import handleChats from "./v1/chats/handler";
import createLesson from "./v1/courses/[courseId]/lessons/_post";

export type route = {
    router: Router;
};

export const routes: route[] = [
    {
        router: sendCode,
    },
    {
        router: verifyCode,
    },
    {
        router: register,
    },
    {
        router: me,
    },
    {
        router: refreshToken,
    },
    {
        router: createLesson,
    },
    {
        router: sendMessage,
    },
    {
        router: handleChats,
    },
];
