import { Router } from "express";

import {
    createInterviewQuestion,
    getInterviewQuestions,
    getInterviewQuestion,
    updateInterviewQuestion,
    deleteInterviewQuestion,
    getInterviewCategories,
    getInterviewTopics,
} from "../controllers/interview.controller";

import {
    getInterviewProgress,
    toggleCompleted,
    toggleBookmark,
  } from "../controllers/interviewProgress.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get( "/categories", authMiddleware, getInterviewCategories);

router.get( "/topics/:category", authMiddleware, getInterviewTopics);

router.get( "/questions", authMiddleware, getInterviewQuestions);

router.get( "/questions/:id", authMiddleware, getInterviewQuestion);

router.post( "/questions", authMiddleware, createInterviewQuestion);

router.put( "/questions/:id", authMiddleware, updateInterviewQuestion);

router.delete( "/questions/:id", authMiddleware, deleteInterviewQuestion);

router.get(
    "/progress",
    authMiddleware,
    getInterviewProgress
  );
  
  router.post(
    "/progress/completed",
    authMiddleware,
    toggleCompleted
  );
  
  router.post(
    "/progress/bookmark",
    authMiddleware,
    toggleBookmark
  );

export default router;