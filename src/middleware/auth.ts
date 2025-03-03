// Auth middleware

import { NextFunction, Response } from "express";
import { ExtendedRequest } from "../types/request";
import { verifyUser } from "../utils/jwt";
import { prisma } from "../db/prisma";

// Middleware function to authorize user
export async function authorize(
    req: ExtendedRequest,
    res: Response,
    next: NextFunction
) {
    // Get the token from the request headers
    const token = req.headers.authorization;

    // If no token is provided, return an unauthorized response
    if (!token) {
        console.log("Missing token");
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        // Verify the token and get user data
        const data = await verifyUser(token);

        // If token is invalid, return an unauthorized response
        if (!data) {
            console.log("Invalid token");
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Find the user in the database
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

        // If user is not found, return an unauthorized response
        if (!user) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // Attach user and courses data to the request object
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

        // Call the next middleware function
        next();
    } catch (error) {
        // If an error occurs, return an unauthorized response
        return res.status(401).json({ error: "Unauthorized" });
    }
}
