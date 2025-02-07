// POST /v1/auth/refresh-token
// Refreshes the JWT

import { Response, Router } from "express";
import { ExtendedRequest } from "../../../types/request";
import { signUser } from "../../../utils/jwt";
import { authorize } from "../../../middleware/auth";

const router = Router();

router.use(authorize as any);

router.post(
    "/v1/auth/refresh-token",
    // @ts-ignore
    async (req: ExtendedRequest, res: Response) => {
        try {
            const jwt = await signUser(req.user);

            res.status(200).json({ jwt });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: "Internal server error" });
        }
    }
);

export default router;
