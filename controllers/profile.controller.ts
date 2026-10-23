import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";


import {
  getProfile as getProfileService,
  updateProfile as updateProfileService,
  addSkill as addSkillService,
  removeSkill as removeSkillService,
  updateProfileImage as updateProfileImageService,
  uploadResumeService,
  updateUser as updateUserService
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

    const result = await getProfileService(userId);

    const profileUrl = `${req.protocol}://${req.get("host")}/uploads/profile/`

    const profileData = result.profile
      ? result.profile.toObject()
      : {};

    res.status(200).json({
      success: true,

      profile: {
        ...profileData,

        userId: {
          name: result.user.name,
          email: result.user.email,
          profileImage: `${profileUrl + result.user.profileImage}` || "",
        },
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);

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

export const updateUser = async (
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

    const user = await updateUserService(
      userId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "User name updated successfully",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update user",
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

export const updateProfileImage = async (
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

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Profile image is required",
      });
      return;
    }

    const profileImage =
      `${req.file.filename}`;

    const user = await updateProfileImageService(
      userId,
      profileImage
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      profileImage: user.profileImage,
    });
  } catch (error) {
    console.error(
      "Update profile image error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to update profile image",
    });
  }
};

export const uploadResume = async (
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

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Resume is required",
      });
      return;
    }

    const result = await uploadResumeService(
      userId,
      req.file.originalname,
      req.file.buffer
    );

    res.status(200).json({
      success: true,
      message:
        "Resume uploaded and profile updated successfully",

      user: result.user,

      profile: {
        ...result.profile.toObject(),

        userId: {
          id: result.user._id,
          name: result.user.name,
          email: result.user.email,
          profileImage:
            result.user.profileImage,
        },
      },

      extractedData: result.extractedData,
    });
  } catch (error) {
    console.error(
      "Upload resume error:",
      error
    );

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to upload resume",
    });
  }
};