import { NextFunction, Response } from "express";
import { authorize } from "../../../middleware/auth";
import { ExtendedRequest } from "../../../types/request";
import _get from "./_get";
import _post from "./_post";

export default [
    authorize,
    (req: ExtendedRequest, res: Response, next: NextFunction) => {
        if (req.method === "GET") {
            return _get(req, res);
        }

        if (req.method === "POST") {
            return _post(req, res);
        }

        res.status(405).json({ error: "Method not allowed" });
    },
];
