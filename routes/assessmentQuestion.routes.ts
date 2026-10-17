import {
    Router,
  } from "express";
  
  import {
    authMiddleware,
  } from "../middleware/auth.middleware";
  
  import {
    getAssessmentCategories,
    getAssessmentQuestions,
    getAssessmentTopics,
  } from "../controllers/assessmentQuestion.controller";
  
  const router =
    Router();
  
  router.get(
    "/categories",
    authMiddleware,
    getAssessmentCategories
  );
  
  router.get(
    "/topics/:category",
    authMiddleware,
    getAssessmentTopics
  );
  
  router.get(
    "/questions",
    authMiddleware,
    getAssessmentQuestions
  );
  
  export default router;