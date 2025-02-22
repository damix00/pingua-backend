import { Router } from "express";
import { authorize } from "../../../../middleware/auth";
import questionHandler from "./questions/[questionId]/handler";
import createLesson from "./lessons/_post";
import patchLesson from "./lessons/[lessonId]/_patch";
import patchCourse from "./_patch";

const router = Router();

router.use("/:courseId", authorize as any);

router.use("/", questionHandler);
router.use("/", createLesson);
router.use("/", patchLesson);
router.patch("/:courseId", patchCourse as any);

export default router;
