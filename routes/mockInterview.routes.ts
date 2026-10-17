import { Router } from "express";
import { authMiddleware} from "../middleware/auth.middleware";
import {
    createMockInterview,
    getMockInterviews,
    getMockInterview,
    submitAnswer,
    completeInterview,
    abandonInterview,
    removeMockInterview,
} from "../controllers/mockInterview.controller";

const router = Router();

//   Start new interview
router.post("/", authMiddleware, createMockInterview);

//   Get user's interview history
router.get("/", authMiddleware, getMockInterviews);

router.get("/:id", authMiddleware, getMockInterview);

router.post("/:id/answer", authMiddleware, submitAnswer);

router.post("/:id/complete", authMiddleware, completeInterview);

router.post("/:id/abandon", authMiddleware, abandonInterview);

router.delete("/:id", authMiddleware, removeMockInterview);

export default router;