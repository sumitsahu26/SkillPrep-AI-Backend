import {
    Router,
  } from "express";
  
  import {
    authMiddleware,
  } from "../middleware/auth.middleware";
  
  import {
    getAssessment,
    getAssessments,
    removeAssessment,
    startAssessment,
    submitAssessment,
  } from "../controllers/skillAssessment.controller";
  
  const router =
    Router();
  
  router.post(
    "/start",
    authMiddleware,
    startAssessment
  );
  
  router.post(
    "/:id/submit",
    authMiddleware,
    submitAssessment
  );
  
  router.get(
    "/",
    authMiddleware,
    getAssessments
  );
  
  router.get(
    "/:id",
    authMiddleware,
    getAssessment
  );
  
  router.delete(
    "/:id",
    authMiddleware,
    removeAssessment
  );
  
  export default router;