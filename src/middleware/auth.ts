// Auth middleware

import { NextFunction, Response } from "express";
import { ExtendedRequest } from "../types/request";
import { verifyUser } from "../utils/jwt";
import { prisma } from "../db/prisma";

export async function authorize(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) {
    const token = req.headers.authorization;

    if (!token) {
        console.log("Missing token");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const data = await verifyUser(token);

        if (!data) {
            console.log("Invalid token");

            return res.status(401).json({ error: "Unauthorized" });
        }

        const user = await prisma.user.findUnique({
            where: {
                id: data.id,
                email: data.email,
            },
            include: {
                courses: {
                    include: {
                        sections: {
                            where: {
                                finished: false,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        req.user = {
            ...user,
            plan:
                user.planExpiresAt && user.planExpiresAt < new Date()
                    ? "FREE"
                    : user.plan,
        };
        req.courses = user.courses.map((course) => ({
            ...course,
            section: course.sections[0],
        }));

        next();
    } catch (error) {
        return res.status(401).json({ error: "Unauthorized" });
    }
}
