import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";
import { signUser } from "../../../utils/jwt";
import { authorize } from "../../../middleware/auth";

export default [
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
