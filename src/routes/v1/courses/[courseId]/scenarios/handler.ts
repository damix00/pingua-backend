import { Router } from "express";
import { authorize } from "../../../../../middleware/auth";
import _get from "./_get";

const router = Router();

router.use(authorize as any);

router.get("/", _get as any);

export default router;
