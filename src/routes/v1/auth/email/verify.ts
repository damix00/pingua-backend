import { Response } from "express";
import { ExtendedRequest } from "../../../../types/request";
import { Course, User, VerificationStatus } from "@prisma/client";
import { prisma } from "../../../../db/prisma";
import { signUser } from "../../../../utils/jwt";
import { toAuthUser } from "../../../../db/transformators/user";

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

export default async function verifyCode(req: ExtendedRequest, res: Response) {
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

        let courses: Course[] = [];

        if (result.user) {
            courses = await prisma.course.findMany({
                where: {
                    userId: result.user.id,
                },
            });
        }

        return res.status(200).json({
            user: result.user && toAuthUser(result.user),
            courses,
            jwt: result.jwt,
            id: result.id,
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json({
            error: "Internal server error",
        });
    }
}
