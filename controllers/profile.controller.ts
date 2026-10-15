import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  getProfile as getProfileService,
  updateProfile as updateProfileService,
  addSkill as addSkillService,
  removeSkill as removeSkillService,
} from "../services/profile.service";

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const profile = await getProfileService(userId);

    res.status(200).json({
      success: true,
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get profile",
    });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const profile = await updateProfileService(
      userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      profile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

export const addSkill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { skill } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!skill) {
      res.status(400).json({
        success: false,
        message: "Skill is required",
      });
      return;
    }

    const profile = await addSkillService(userId, skill);

    res.status(200).json({
      success: true,
      message: "Skill added successfully",
      profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to add skill",
    });
  }
};

export const removeSkill = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const skill = req.params.skill;

    if (!skill || Array.isArray(skill)) {
    res.status(400).json({
        success: false,
        message: "Valid skill is required",
    });
    return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const profile = await removeSkillService(
      userId,
      decodeURIComponent(skill)
    );

    res.status(200).json({
      success: true,
      message: "Skill removed successfully",
      profile,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to remove skill",
    });
  }
};