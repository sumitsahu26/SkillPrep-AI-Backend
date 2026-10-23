import { Router } from "express";

import {
  getProfile,
  updateProfile,
  addSkill,
  removeSkill,
  updateProfileImage,
  uploadResume,
  updateUser
} from "../controllers/profile.controller";

import { authMiddleware } from "../middleware/auth.middleware";
import { upload } from "../middleware/upload.middleware";
import { resumeUpload } from "../middleware/resumeUpload.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getProfile);

router.put("/", updateProfile);

router.put("/user", updateUser);

router.post("/skills", addSkill);

router.delete("/skills/:skill", removeSkill);

router.put("/image", upload.single("profileImage"), updateProfileImage);

router.post("/resume", resumeUpload.single("resume"), uploadResume);

export default router;