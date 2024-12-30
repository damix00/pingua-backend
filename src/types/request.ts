import { Course, Section, User } from "@prisma/client";
import { Request } from "express";

// This is the extended request object that we will use throughout the application
export interface ExtendedRequest extends Request {
    userAgent: string; // This is the user agent of the request
    user: User;
    jwt: string;
    courses: (Course & {
        sections: Section[];
    })[];
}
