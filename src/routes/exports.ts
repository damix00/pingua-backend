import { Router } from "express";
import sendCode from "./v1/auth/email/send-code";
import verifyCode from "./v1/auth/email/verify";
import me from "./v1/auth/me";
import refreshToken from "./v1/auth/refresh-token";
import register from "./v1/auth/register";
import sendMessage from "./v1/chats/[chat_id]/messages/_post";
import handleChats from "./v1/chats/handler";
import createLesson from "./v1/courses/[courseId]/lessons/_post";
import translate from "./v1/translations/_post";
import handleMessages from "./v1/chats/[chat_id]/messages/[message_id]/handler";
import updateLesson from "./v1/courses/[courseId]/lessons/[lessonId]/_patch";

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
        router: createLesson,
        basePath: "/v1/courses",
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
        router: updateLesson,
        basePath: "/v1/courses/",
    },
];
