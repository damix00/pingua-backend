import jwt from "jsonwebtoken";
import config from "./config";
import { User } from "@prisma/client";

const secret = config.get("JWT_SECRET");

export async function sign(payload: any): Promise<string> {
    return jwt.sign(payload, secret, {
        expiresIn: "7d",
    });
}

export async function verify(token: string): Promise<any> {
    return jwt.verify(token, secret);
}

export async function signUser(user: User): Promise<string> {
    return sign({
        id: user.id,
        email: user.email,
        resetToken: user.resetToken,
    });
}
