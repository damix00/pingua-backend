import { NextFunction, Response, Router } from "express";
import { authorize } from "../../../middleware/auth";
import { ExtendedRequest } from "../../../types/request";
import _get from "./_get";
import _post from "./_post";

const router = Router();

router.use(authorize as any);

router.get("/", _get as any);
router.post("/", _post as any);

export default router;
