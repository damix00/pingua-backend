import { Router } from "express";
import { authorize } from "../../../../middleware/auth";
import questionHandler from "./questions/[questionId]/handler";
import createLesson from "./lessons/_post";
import patchLesson from "./lessons/[lessonId]/_patch";

const router = Router();

router.use("/:courseId", authorize as any);

router.use("/", questionHandler);
router.use("/", createLesson);
router.use("/", patchLesson);

export default router;
