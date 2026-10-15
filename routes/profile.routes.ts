import { Router } from "express";

import {
  getProfile,
  updateProfile,
  addSkill,
  removeSkill,
} from "../controllers/profile.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);

router.put("/", updateProfile);

router.post("/skills", addSkill);

router.delete("/skills/:skill", removeSkill);

export default router;