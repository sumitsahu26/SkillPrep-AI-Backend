import {
  Response,
} from "express";

import {
  AuthRequest,
} from "../middleware/auth.middleware";

import {
  createRoadmap,
  deleteRoadmap,
  getRoadmapById,
  getUserRoadmaps,
  toggleRoadmapTopic,
} from "../services/roadmap.service";
import { createNotification } from "../services/notification.service";

//  GENERATE

export const generateRoadmap =
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

      const {
        targetRole,
        experience,
        durationWeeks,
        currentSkills,
        targetSkills,
      } = req.body;

      if (
        typeof targetRole !==
        "string" ||
        !targetRole.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Target role is required",
          });
      }

      if (
        typeof experience !==
        "string" ||
        !experience.trim()
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Experience is required",
          });
      }

      const weeks =
        Number(
          durationWeeks
        );

      if (
        !Number.isInteger(
          weeks
        ) ||
        weeks < 1 ||
        weeks > 52
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Duration must be between 1 and 52 weeks",
          });
      }

      const skills =
        Array.isArray(
          currentSkills
        )
          ? currentSkills.filter(
            (
              skill
            ): skill is string =>
              typeof skill ===
              "string" &&
              Boolean(
                skill.trim()
              )
          )
          : [];

      const targets =
        Array.isArray(
          targetSkills
        )
          ? targetSkills.filter(
            (
              skill
            ): skill is string =>
              typeof skill ===
              "string" &&
              Boolean(
                skill.trim()
              )
          )
          : [];

      const roadmap =
        await createRoadmap({
          userId,

          targetRole:
            targetRole.trim(),

          experience:
            experience.trim(),

          durationWeeks:
            weeks,

          currentSkills:
            skills,

          targetSkills:
            targets,
        });

        if(roadmap) {
          await createNotification({
            userId,
            title: "Roadmap updated",
            description:
              "Your learning roadmap has a new recommended step.",
            type: "roadmap",
            link: "/roadmap",
            preferenceKey: "roadmapUpdates",
          });
        }

      return res
        .status(201)
        .json({
          success: true,

          message:
            "Roadmap generated successfully",

          roadmap,
        });
    } catch (error) {
      console.error(
        "Generate roadmap:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to generate roadmap",
        });
    }
  };

//  GET ALL

export const getRoadmaps =
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

      const roadmaps =
        await getUserRoadmaps(
          userId
        );

      return res.json({
        success: true,

        count:
          roadmaps.length,

        roadmaps,
      });
    } catch (error) {
      return res
        .status(500)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to load roadmaps",
        });
    }
  };

//  GET ONE

export const getRoadmap =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.user?.userId;

      const { id } =
        req.params;

      if (
        !userId ||
        typeof id !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid request",
          });
      }

      const roadmap =
        await getRoadmapById(
          id,
          userId
        );

      return res.json({
        success: true,

        roadmap,
      });
    } catch (error) {
      return res
        .status(404)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Roadmap not found",
        });
    }
  };

//  TOGGLE TOPIC

export const toggleTopic =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.user?.userId;

      const {
        id,
        topicId,
      } = req.params;

      if (
        !userId ||
        typeof id !==
        "string" ||
        typeof topicId !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid request",
          });
      }

      const roadmap =
        await toggleRoadmapTopic(
          id,
          userId,
          topicId
        );

      return res.json({
        success: true,

        message:
          "Roadmap progress updated",

        roadmap,
      });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to update roadmap",
        });
    }
  };

//  DELETE

export const removeRoadmap =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const userId =
        req.user?.userId;

      const { id } =
        req.params;

      if (
        !userId ||
        typeof id !==
        "string"
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid request",
          });
      }

      await deleteRoadmap(
        id,
        userId
      );

      return res.json({
        success: true,

        message:
          "Roadmap deleted successfully",
      });
    } catch (error) {
      return res
        .status(400)
        .json({
          success: false,

          message:
            error instanceof Error
              ? error.message
              : "Failed to delete roadmap",
        });
    }
  };