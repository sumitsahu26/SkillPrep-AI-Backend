import { Response } from "express";

import {
  AuthRequest,
} from "../middleware/auth.middleware";

import {
  generateInterviewQuestions,
  AIDifficulty,
} from "../services/aiInterview.service";

const allowedDifficulties: AIDifficulty[] =
  [
    "Easy",
    "Medium",
    "Hard",
  ];

export const generateAIInterviewQuestions =
  async (
    req: AuthRequest,
    res: Response
  ) => {
    try {
      const {
        technology,
        topic,
        difficulty,
        experience,
        questionCount = 5,
      } = req.body;

      /* Technology */

      if (
        !technology ||
        typeof technology !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Technology is required",
        });
      }

      /* Difficulty */

      if (
        !difficulty ||
        !allowedDifficulties.includes(
          difficulty
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Valid difficulty is required",
        });
      }

      /* Experience */

      if (
        !experience ||
        typeof experience !== "string"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Experience is required",
        });
      }

      /* Question count */

      const count =
        Number(questionCount);

      if (
        !Number.isInteger(count) ||
        count < 1 ||
        count > 20
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Question count must be between 1 and 20",
        });
      }

      /* Logged-in user */

      const userId =
        req.user?.userId;

      /* Generate + save */

      const questions =
        await generateInterviewQuestions(
          {
            technology:
              technology.trim(),

            topic:
              typeof topic ===
              "string"
                ? topic.trim()
                : "General",

            difficulty,

            experience:
              experience.trim(),

            questionCount:
              count,

            userId,
          }
        );

      return res.status(200).json({
        success: true,

        message:
          questions.length > 0
            ? `${questions.length} new AI questions generated and saved`
            : "Questions were generated, but they already exist in the question bank",

        count: questions.length,

        questions,
      });
    } catch (error) {
      console.error(
        "Generate AI interview questions error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          error instanceof Error
            ? error.message
            : "Failed to generate interview questions",
      });
    }
  };