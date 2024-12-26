import { Response } from "express";
import { ExtendedRequest } from "../../../../types/request";
import { getRandomInt } from "../../../../utils/crypto";
import { prisma } from "../../../../db/prisma";
import { VerificationStatus } from "@prisma/client";
import { generateTemplate, resend } from "../../../../apis/resend/resend";
import path from "path";

async function generateCode(
    email: string,
    ip?: string | null
): Promise<string> {
    let exists = true;

    do {
        const code = getRandomInt(100000, 999999).toString(); // 6 digits

        // Check if code already exists
        exists =
            (
                await prisma.verificationCode.findUnique({
                    where: { code },
                })
            )?.code != null;

        if (!exists) {
            await prisma.verificationCode.deleteMany({
                where: { email },
            });

            await prisma.verificationCode.create({
                data: {
                    code,
                    email,
                    status: VerificationStatus.PENDING,
                    ip,
                    expiresAt: new Date(Date.now() + 1000 * 60 * 20), // 20 minutes
                },
            });

            return code;
        }
    } while (exists);

    return "";
}

export default async function sendCode(req: ExtendedRequest, res: Response) {
    try {
        const email = req.body.email;

        if (!email) {
            return res.status(400).json({
                error: "Email is required",
            });
        }

        if (email.length > 255) {
            return res.status(400).json({
                error: "Email is too long",
            });
        }

        if (!email.includes("@")) {
            return res.status(400).json({
                error: "Invalid email",
            });
        }

        const code = await generateCode(email, req.ip);

        console.log(`Verification code for ${email}: ${code}`);

        // const response = await resend.emails.send({
        //     from: "noreply@notifications.latinary.com",
        //     to: [email],
        //     subject: "Your Pingua verification code",
        //     html: generateTemplate("verification-code.html", {
        //         code: code,
        //     }),
        // });

        const response = {
            error: false,
        };

        if (response?.error) {
            return res.status(500).json({
                message: "Failed to send email",
            });
        }

        return res.status(200).json({
            message: "Code sent",
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal server error",
        });
    }
}
