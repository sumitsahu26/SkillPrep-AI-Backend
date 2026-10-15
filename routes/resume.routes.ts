import { Router } from "express";

import {
  createResume,
  getAllResumes,
  getResumeById,
  updateResume,
  deleteResume,
} from "../controllers/resume.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.post("/", createResume);

router.get("/", getAllResumes);

router.get("/:id", getResumeById);

router.put("/:id", updateResume);

router.delete("/:id", deleteResume);

export default router;