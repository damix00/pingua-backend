// POST /v1/auth/email/verify
// Verifies the user's email with the provided code

import { Response, Router } from "express";
import { ExtendedRequest } from "../../../../types/request";
import { Course, Section, User, VerificationStatus } from "@prisma/client";
import { prisma } from "../../../../db/prisma";
import { signUser } from "../../../../utils/jwt";
import { toAuthCourse, toAuthUser } from "../../../../db/transformators/user";
import { getSectionByLevel } from "../../../../db/redis/sections";

async function verify(
    email: string,
    code: string
): Promise<{
    success: boolean;
    user?: User | null;
    jwt?: string;
    id?: string;
}> {
    const verificationCode = await prisma.verificationCode.findUnique({
        where: { code },
    });

    if (!verificationCode) {
        console.log("Not found");

        return { success: false };
    }

    if (new Date().getTime() - verificationCode.expiresAt.getTime() > 0) {
        console.log("Expired");

        return { success: false };
    }

    if (
        verificationCode.status === VerificationStatus.VERIFIED ||
        verificationCode.email != email ||
        verificationCode.status === VerificationStatus.CREATING
    ) {
        return { success: false };
    }

    // Check if the user exists
    const user = await prisma.user.findUnique({
        where: { email },
    });

    // If the user exists, mark the code as verified
    // Or if the user doesn't exist and the status is "creating", delete the code
    // Deleting the code frees up storage, instead of keeping it in the database as "verified"
    if (user && verificationCode.status == VerificationStatus.PENDING) {
        await prisma.verificationCode.delete({
            where: { code },
        });
    }

    // If the user doesn't exist and the status is "pending", mark the code as "creating"
    else if (!user && verificationCode.status == VerificationStatus.PENDING) {
        await prisma.verificationCode.update({
            where: { code },
            data: {
                status: VerificationStatus.CREATING,
            },
        });
    }

    return {
        success: true,
        user,
        jwt: user ? await signUser(user) : undefined,
        id: verificationCode.id,
    };
}

const router = Router();

router.post(
    "/v1/auth/email/verify",
    // @ts-ignore
    async (req: ExtendedRequest, res: Response) => {
        try {
            const { email, code } = req.body;

            if (!email || !code) {
                return res.status(400).json({
                    error: "Missing required fields",
                });
            }

            const result = await verify(email, code);

            if (!result.success) {
                return res.status(400).json({
                    error: "Invalid code",
                });
            }

            let courses: (Course & {
                sections: Section[];
            })[] = [];

            if (result.user) {
                courses = await prisma.course.findMany({
                    where: {
                        userId: result.user.id,
                    },
                    include: {
                        sections: {
                            where: {
                                finished: false,
                            },
                        },
                    },
                });
            }

            const sections = [];

            for (const course of courses) {
                const section = await getSectionByLevel(course.level);

                sections.push({
                    course_id: course.id,
                    ...section,
                });
            }

            return res.status(200).json({
                user: result.user && toAuthUser(result.user),
                courses: courses.map((course) =>
                    toAuthCourse({
                        ...course,
                        section: course.sections[0],
                    })
                ),
                jwt: result.jwt,
                id: result.id,
                section_data: sections,
            });
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                error: "Internal server error",
            });
        }
    }
);

export default router;
