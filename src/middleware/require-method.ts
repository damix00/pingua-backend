import { NextFunction, Request, Response } from "express";

export default function requireMethod(method: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        if (req.method !== method) {
            return res.status(405).json({
                error: `Method Not Allowed. Must use ${method}`,
            });
        }

        next();
    };
}
