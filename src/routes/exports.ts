import { Router } from "express";
import sendCode from "./v1/auth/email/send-code";
import verifyCode from "./v1/auth/email/verify";
import me from "./v1/auth/me";
import refreshToken from "./v1/auth/refresh-token";
import register from "./v1/auth/register";
import sendMessage from "./v1/chats/[chat_id]/messages/_post";
import handleChats from "./v1/chats/handler";
import translate from "./v1/translations/_post";
import handleMessages from "./v1/chats/[chat_id]/messages/[message_id]/handler";
import courses from "./v1/courses/[courseId]/handler";
import subscriptions from "./v1/subscriptions/handler";

export type route = {
    router: Router;
    basePath: string;
};

export const routes: route[] = [
    {
        router: sendCode,
        basePath: "/v1/auth/email",
    },
    {
        router: verifyCode,
        basePath: "/v1/auth/email",
    },
    {
        router: register,
        basePath: "/v1/auth",
    },
    {
        router: me,
        basePath: "/v1/auth",
    },
    {
        router: refreshToken,
        basePath: "/v1/auth",
    },
    {
        router: sendMessage,
        basePath: "/v1/chats",
    },
    {
        router: handleChats,
        basePath: "/v1/chats",
    },
    {
        router: translate,
        basePath: "/v1/translations",
    },
    {
        router: handleMessages,
        basePath: "/v1/chats/",
    },
    {
        router: courses,
        basePath: "/v1/courses",
    },
    {
        router: subscriptions,
        basePath: "/v1/subscriptions",
    },
];
