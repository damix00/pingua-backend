import jwt from "jsonwebtoken";
import config from "./config";
import { User } from "@prisma/client";

const secret = config.get("JWT_SECRET");

// Sign a payload with the secret and return the token
export async function sign(payload: any): Promise<string> {
    return jwt.sign(payload, secret, {
        expiresIn: "180d",
    });
}

// Verify a token and return the payload
export async function verify(token: string): Promise<any> {
    try {
        return jwt.verify(token, secret);
    } catch (error) {
        console.error(error);

        return null;
    }
}

export async function verifyUser(token: string): Promise<{
    id: string;
    email: string;
    resetToken: string;
} | null> {
    return await verify(token);
}

export async function signUser(user: User): Promise<string> {
    return sign({
        id: user.id,
        email: user.email,
        resetToken: user.resetToken,
    });
}
