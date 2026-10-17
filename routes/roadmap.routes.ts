import {
    Router,
  } from "express";
  
  import {
    authMiddleware,
  } from "../middleware/auth.middleware";
  
  import {
    generateRoadmap,
    getRoadmaps,
    getRoadmap,
    toggleTopic,
    removeRoadmap,
  } from "../controllers/roadmap.controller";
  
  const router =
    Router();
  
  router.post(
    "/generate",
    authMiddleware,
    generateRoadmap
  );
  
  router.get(
    "/",
    authMiddleware,
    getRoadmaps
  );
  
  router.get(
    "/:id",
    authMiddleware,
    getRoadmap
  );
  
  router.patch(
    "/:id/topics/:topicId",
    authMiddleware,
    toggleTopic
  );
  
  router.delete(
    "/:id",
    authMiddleware,
    removeRoadmap
  );
  
  export default router;