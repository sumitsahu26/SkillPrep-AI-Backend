import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  createResume as createResumeService,
  getAllResumes as getAllResumesService,
  getResumeById as getResumeByIdService,
  updateResume as updateResumeService,
  deleteResume as deleteResumeService,
} from "../services/resume.service";
import { createNotification } from "../services/notification.service";

// CREATE RESUME

export const createResume = async (
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

    const resume = await createResumeService(
      userId,
      req.body
    );

    if(resume) {
      await createNotification({
        userId,
        title: "Resume created",
        description:
          "Your resume has been created successfully.",
        type: "resume",
        link: "/resumes",
        preferenceKey: "resumeUpdates",
      });
    }

    res.status(201).json({
      success: true,
      message: "Resume created successfully",
      resume,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create resume",
    });
  }
};

// GET ALL RESUMES

export const getAllResumes = async (
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

    const resumes = await getAllResumesService(userId);

    res.status(200).json({
      success: true,
      count: resumes.length,
      resumes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to get resumes",
    });
  }
};

// GET SINGLE RESUME


export const getResumeById = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const resumeId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!resumeId || Array.isArray(resumeId)) {
      res.status(400).json({
        success: false,
        message: "Valid resume ID is required",
      });
      return;
    }

    const resume = await getResumeByIdService(
      userId,
      resumeId
    );

    res.status(200).json({
      success: true,
      resume,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Resume not found",
    });
  }
};

// UPDATE RESUME

export const updateResume = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const resumeId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!resumeId || Array.isArray(resumeId)) {
      res.status(400).json({
        success: false,
        message: "Valid resume ID is required",
      });
      return;
    }

    const resume = await updateResumeService(
      userId,
      resumeId,
      req.body
    );

    if(resume) {
      await createNotification({
        userId,
        title: "Resume created",
        description:
          "Your resume has been updated successfully.",
        type: "resume",
        link: "/resumes",
        preferenceKey: "resumeUpdates",
      });
    }

    res.status(200).json({
      success: true,
      message: "Resume updated successfully",
      resume,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update resume",
    });
  }
};

// DELETE RESUME

export const deleteResume = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    const resumeId = req.params.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    if (!resumeId || Array.isArray(resumeId)) {
      res.status(400).json({
        success: false,
        message: "Valid resume ID is required",
      });
      return;
    }

    await deleteResumeService(
      userId,
      resumeId
    );

    res.status(200).json({
      success: true,
      message: "Resume deleted successfully",
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to delete resume",
    });
  }
};