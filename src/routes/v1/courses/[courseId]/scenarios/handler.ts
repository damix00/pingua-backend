import { Router } from "express";
import { authorize } from "../../../../../middleware/auth";
import getScenarios from "./_get";
import createScenarioSession from "./[scenarioId]/_post";
import getScenarioMessages from "./[scenarioId]/[sessionId]/messages/_get";
import createScenarioMessage from "./[scenarioId]/[sessionId]/messages/_post";
import getHistory from "./[scenarioId]/history/_get";

const router = Router();

router.use(authorize as any);

router.get("/:courseId/scenarios", getScenarios as any);
router.post("/:courseId/scenarios/:scenarioId", createScenarioSession as any);
router.get(
    "/:courseId/scenarios/:scenarioId/:sessionId/messages",
    getScenarioMessages as any
);
router.post(
    "/:courseId/scenarios/:scenarioId/:sessionId/messages",
    createScenarioMessage as any
);
router.get("/:courseId/scenarios/:scenarioId/history", getHistory as any);

export default router;
