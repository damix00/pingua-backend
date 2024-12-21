import { Response } from "express";
import { ExtendedRequest } from "../../../types/request";

export default (req: ExtendedRequest, res: Response) => {
    res.json({
        message: "Signup route",
    });
};
