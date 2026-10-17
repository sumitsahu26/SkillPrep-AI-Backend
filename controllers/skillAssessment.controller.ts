import {
    Response,
  } from "express";
  
  import {
    AuthRequest,
  } from "../middleware/auth.middleware";
  
  import {
    deleteSkillAssessment,
    getSkillAssessmentById,
    getUserSkillAssessments,
    sanitizeAssessment,
    startSkillAssessment,
    submitSkillAssessment,
  } from "../services/skillAssessment.service";
  
  /* =========================================================
     START
  ========================================================= */
  
  export const startAssessment =
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
          technology,
          topic,
          difficulty,
          questionCount,
        } = req.body;
  
        if (
          typeof technology !==
            "string" ||
          !technology.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
  
              message:
                "Technology is required",
            });
        }
  
        if (
          ![
            "Easy",
            "Medium",
            "Hard",
          ].includes(
            difficulty
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
  
              message:
                "Invalid difficulty",
            });
        }
  
        const count =
          Number(
            questionCount
          );
  
        if (
          !Number.isInteger(
            count
          ) ||
          count < 1 ||
          count > 50
        ) {
          return res
            .status(400)
            .json({
              success: false,
  
              message:
                "Question count must be between 1 and 50",
            });
        }
  
        const assessment =
          await startSkillAssessment(
            {
              userId,
  
              technology:
                technology.trim(),
  
              topic:
                typeof topic ===
                  "string" &&
                topic.trim()
                  ? topic.trim()
                  : "General",
  
              difficulty,
  
              questionCount:
                count,
            }
          );
  
        return res
          .status(201)
          .json({
            success: true,
  
            message:
              "Assessment started successfully",
  
            assessment:
              sanitizeAssessment(
                assessment
              ),
          });
      } catch (error) {
        console.error(
          "Start assessment:",
          error
        );
  
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to start assessment",
          });
      }
    };
  
  /* =========================================================
     SUBMIT
  ========================================================= */
  
  export const submitAssessment =
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
  
        const { answers } =
          req.body;
  
        if (
          !Array.isArray(
            answers
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
  
              message:
                "Answers are required",
            });
        }
  
        const assessment =
          await submitSkillAssessment(
            id,
            userId,
            answers
          );
  
        return res.json({
          success: true,
  
          message:
            "Assessment submitted successfully",
  
          assessment,
        });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to submit assessment",
          });
      }
    };
  
  /* =========================================================
     GET ALL
  ========================================================= */
  
  export const getAssessments =
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
  
        const assessments =
          await getUserSkillAssessments(
            userId
          );
  
        return res.json({
          success: true,
  
          count:
            assessments.length,
  
          assessments:
            assessments.map(
              sanitizeAssessment
            ),
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to load assessments",
          });
      }
    };
  
  /* =========================================================
     GET ONE
  ========================================================= */
  
  export const getAssessment =
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
  
        const assessment =
          await getSkillAssessmentById(
            id,
            userId
          );
  
        return res.json({
          success: true,
  
          assessment:
            sanitizeAssessment(
              assessment
            ),
        });
      } catch (error) {
        return res
          .status(404)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Assessment not found",
          });
      }
    };
  
  /* =========================================================
     DELETE
  ========================================================= */
  
  export const removeAssessment =
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
  
        await deleteSkillAssessment(
          id,
          userId
        );
  
        return res.json({
          success: true,
  
          message:
            "Assessment deleted successfully",
        });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to delete assessment",
          });
      }
    };