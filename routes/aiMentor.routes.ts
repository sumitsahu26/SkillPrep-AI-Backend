import {
    Router,
  } from "express";
  
  import {
    authMiddleware,
  } from "../middleware/auth.middleware";
  
  import {
    chatWithMentor,
    clearMentorChat,
    mentorHistory,
  } from "../controllers/aiMentor.controller";
  
  const router =
    Router();
  
  router.post(
    "/chat",
    authMiddleware,
    chatWithMentor
  );
  
  router.get(
    "/history",
    authMiddleware,
    mentorHistory
  );
  
  router.delete(
    "/history",
    authMiddleware,
    clearMentorChat
  );
  
  export default router;