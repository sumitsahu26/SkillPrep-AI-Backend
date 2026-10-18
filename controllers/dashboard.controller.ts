import { Response } from "express";

import {
  AuthRequest,
} from "../middleware/auth.middleware";

import {
  getDashboardData,
} from "../services/dashboard.service";

export const getDashboard =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.user?.userId;

      if (!userId) {
        return res
          .status(401)
          .json({
            success: false,
            message:
              "Unauthorized",
          });
      }

      const dashboard =
        await getDashboardData(
          userId
        );

      return res.json({
        success: true,
        dashboard,
      });
    } catch (error) {
      console.error(
        "Dashboard error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to load dashboard",
        });
    }
  };