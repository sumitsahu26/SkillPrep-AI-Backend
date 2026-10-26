import { Response } from "express";

import { AuthRequest } from "../middleware/auth.middleware";

import {
  getNotificationPreferences,
  updateNotificationPreferences,
} from "../services/notificationPreference.service";

export const getPreferences = async (
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

    const preferences =
      await getNotificationPreferences(userId);

    res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error(
      "Get notification preferences error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to get notification preferences",
    });
  }
};

export const updatePreferences = async (
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

    const preferences =
      await updateNotificationPreferences(
        userId,
        req.body
      );

    res.status(200).json({
      success: true,
      message:
        "Notification preferences updated successfully",
      preferences,
    });
  } catch (error) {
    console.error(
      "Update notification preferences error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
        "Failed to update notification preferences",
    });
  }
};