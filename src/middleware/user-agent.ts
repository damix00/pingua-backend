import { NextFunction, Response } from "express";
import { ExtendedRequest } from "../types/request";

// Middleware function to get the user agent from the request headers
export default function userAgent(
    req: ExtendedRequest | any,
    res: Response,
    next: NextFunction
) {
    req.userAgent = req.get("User-Agent") || "";
    next();
}
