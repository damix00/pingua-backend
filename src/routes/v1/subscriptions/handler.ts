import { Router } from "express";
import _post from "./_post";
import { authorize } from "../../../middleware/auth";
import webhook from "./webhook";
import _delete from "./_delete";

const router = Router();

router.post("/", authorize as any, _post as any);
router.delete("/", authorize as any, _delete as any);

router.post("/webhook", webhook as any);

export default router;
