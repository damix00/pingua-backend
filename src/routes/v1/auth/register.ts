import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { prisma } from "../../../db/prisma";
import { AppSections, VerificationStatus } from "@prisma/client";
import { signUser } from "../../../utils/jwt";
import { toAuthUser } from "../../../db/transformators/user";
import { isSupportedLanguage } from "../../../db/languages";
import { getSection } from "../../../utils/leveling";

async function checkCode(id: string, email: string): Promise<boolean> {
    try {
        const code = await prisma.verificationCode.findUnique({
            where: { id },
        });

        if (!code) {
            return false;
        }

        if (
            code.email !== email ||
            code.status == VerificationStatus.VERIFIED
        ) {
            return false;
        }

        if (new Date().getTime() - code.expiresAt.getTime() > 0) {
            return false;
        }

        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export default async function register(req: ExtendedRequest, res: Response) {
    const {
        email,
        code_id,
        username,
        name,
        language_code,
        fluency_level,
        app_locale,
    } = req.body;

    if (
        !email ||
        !code_id ||
        !username ||
        !name ||
        !language_code ||
        !app_locale
    ) {
        return res.status(400).json({
            success: false,
            message: "Missing email or code_id",
        });
    }

    try {
        const codeExists = await checkCode(code_id, email);

        if (!codeExists) {
            return res.status(401).json({
                success: false,
                message: "Invalid code",
            });
        }

        const userExists = await prisma.user.findFirst({
            where: { email },
        });

        if (userExists) {
            return res.status(409).json({
                success: false,
                message: "User already exists",
            });
        }

        if (!isSupportedLanguage(language_code)) {
            return res.status(404).json({
                success: false,
                message: "Language not found",
            });
        }

        const user = await prisma.user.create({
            data: {
                email,
                username,
                name,
            },
        });

        if (!user) {
            console.error("Failed to create user");

            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }

        const course = await prisma.course.create({
            data: {
                appLanguageCode: app_locale,
                languageCode: language_code,
                xp: 0,
                level: 1,
                fluencyLevel: parseInt(fluency_level),
                user: {
                    connect: {
                        id: user.id,
                    },
                },
            },
        });

        const sections = await prisma.section.createMany({
            data: [
                {
                    courseId: course.id,
                    finished: false,
                    level: 1,
                    accessible: true,
                    section: getSection(1),
                },
            ],
        });

        await prisma.verificationCode.deleteMany({
            where: { email },
        });

        const jwt = await signUser(user);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            jwt,
            user: toAuthUser(user),
            courses: [
                {
                    ...course,
                    sections,
                },
            ],
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
}
