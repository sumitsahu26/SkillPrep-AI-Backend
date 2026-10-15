import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

import {
  getUserInterviewProgress,
  toggleCompletedQuestion,
  toggleBookmarkedQuestion,
} from "../services/interviewProgress.service";

export const getInterviewProgress = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const progress = await getUserInterviewProgress(userId);

    return res.status(200).json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("Get interview progress error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get interview progress",
    });
  }
};

export const toggleCompleted = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { questionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!questionId || typeof questionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const progress = await toggleCompletedQuestion(
      userId,
      questionId
    );

    return res.status(200).json({
      success: true,
      message: "Completed status updated",
      progress,
    });
  } catch (error) {
    console.error("Toggle completed error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update completed status",
    });
  }
};

export const toggleBookmark = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    const { questionId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (!questionId || typeof questionId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Question ID is required",
      });
    }

    const progress = await toggleBookmarkedQuestion(
      userId,
      questionId
    );

    return res.status(200).json({
      success: true,
      message: "Bookmark status updated",
      progress,
    });
  } catch (error) {
    console.error("Toggle bookmark error:", error);

    return res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update bookmark",
    });
  }
};