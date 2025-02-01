// POST /v1/auth/refresh-token
// Refreshes the JWT

import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { signUser } from "../../../utils/jwt";
import { authorize } from "../../../middleware/auth";
import requireMethod from "../../../middleware/require-method";

export default [
    requireMethod("POST"),
    authorize,
    async (req: ExtendedRequest, res: Response) => {
        try {
            const jwt = await signUser(req.user);

            res.status(200).json({ jwt });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    },
];
