import { Router } from "express";

import {
  authMiddleware,
} from "../middleware/auth.middleware";

import {
  generateAIInterviewQuestions,
} from "../controllers/aiInterview.controller";

const router = Router();

router.post(
  "/generate",
  authMiddleware,
  generateAIInterviewQuestions
);

export default router;