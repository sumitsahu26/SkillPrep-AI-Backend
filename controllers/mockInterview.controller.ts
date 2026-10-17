import {
    Response,
  } from "express";
  
  import {
    AuthRequest,
  } from "../middleware/auth.middleware";
  
  import {
    startMockInterview,
    getUserMockInterviews,
    getMockInterviewById,
    submitMockInterviewAnswer,
    completeMockInterview,
    abandonMockInterview,
    deleteMockInterview,
    MockInterviewDifficulty,
  } from "../services/mockInterview.service";
  
  /* =========================================================
     START INTERVIEW
  ========================================================= */
  
  export const createMockInterview =
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
          experience,
          questionCount = 5,
        } = req.body;
  
        if (
          !technology ||
          typeof technology !==
            "string"
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
          !experience ||
          typeof experience !==
            "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Experience is required",
            });
        }
  
        const difficulties: MockInterviewDifficulty[] =
          [
            "Easy",
            "Medium",
            "Hard",
          ];
  
        if (
          !difficulty ||
          !difficulties.includes(
            difficulty
          )
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Valid difficulty is required",
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
          count > 20
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Question count must be between 1 and 20",
            });
        }
  
        const interview =
          await startMockInterview(
            {
              userId,
  
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
            }
          );
  
          return res.status(201).json({
            success: true,
          
            message:
              interview.usedFallback
                ? `Mock interview started with ${interview.actualQuestionCount} available questions.`
                : "Mock interview started successfully",
          
            requestedQuestionCount:
              interview.requestedQuestionCount,
          
            actualQuestionCount:
              interview.actualQuestionCount,
          
            usedFallback:
              interview.usedFallback,
          
            interview:
              interview.interview,
          });
      } catch (error) {
        console.error(
          "Create mock interview:",
          error
        );
  
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to start mock interview",
          });
      }
    };
  
  /* =========================================================
     GET ALL USER INTERVIEWS
  ========================================================= */
  
  export const getMockInterviews =
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
  
        const interviews =
          await getUserMockInterviews(
            userId
          );
  
        return res.json({
          success: true,
  
          count:
            interviews.length,
  
          interviews,
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to load mock interviews",
          });
      }
    };
  
  /* =========================================================
     GET SINGLE INTERVIEW
  ========================================================= */
  
  export const getMockInterview =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const userId =
          req.user?.userId;
  
        const id =
          req.params.id;
  
        if (!userId) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Unauthorized",
            });
        }
  
        if (
          typeof id !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid interview ID",
            });
        }
  
        const interview =
          await getMockInterviewById(
            id,
            userId
          );
  
        return res.json({
          success: true,
  
          interview,
        });
      } catch (error) {
        return res
          .status(404)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Mock interview not found",
          });
      }
    };
  
  /* =========================================================
     SUBMIT ANSWER
  ========================================================= */
  
  export const submitAnswer =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const userId =
          req.user?.userId;
  
        const interviewId =
          req.params.id;
  
        const {
          questionId,
          answer,
        } = req.body;
  
        if (!userId) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Unauthorized",
            });
        }
  
        if (
          typeof interviewId !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid interview ID",
            });
        }
  
        if (
          !questionId ||
          typeof questionId !==
            "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Question ID is required",
            });
        }
  
        if (
          !answer ||
          typeof answer !==
            "string" ||
          !answer.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Answer is required",
            });
        }
  
        const result =
        await submitMockInterviewAnswer(
          interviewId,
          userId,
          questionId,
          answer
        );
      
      return res.json({
        success: true,
      
        message:
          result.evaluationSuccessful
            ? "Answer evaluated successfully"
            : "Answer saved, but AI evaluation is currently unavailable",
      
        evaluationSuccessful:
          result.evaluationSuccessful,
      
        evaluation:
          result.evaluation,
      
        interview:
          result.interview,
      });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to submit answer",
          });
      }
    };
  
  /* =========================================================
     COMPLETE
  ========================================================= */
  
  export const completeInterview =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const userId =
          req.user?.userId;
  
        const id =
          req.params.id;
  
        if (!userId) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Unauthorized",
            });
        }
  
        if (
          typeof id !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid interview ID",
            });
        }
  
        const interview =
          await completeMockInterview(
            id,
            userId
          );
  
        return res.json({
          success: true,
  
          message:
            "Mock interview completed",
  
          interview,
        });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to complete interview",
          });
      }
    };
  
  /* =========================================================
     ABANDON
  ========================================================= */
  
  export const abandonInterview =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const userId =
          req.user?.userId;
  
        const id =
          req.params.id;
  
        if (!userId) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Unauthorized",
            });
        }
  
        if (
          typeof id !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid interview ID",
            });
        }
  
        const interview =
          await abandonMockInterview(
            id,
            userId
          );
  
        return res.json({
          success: true,
  
          message:
            "Mock interview abandoned",
  
          interview,
        });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to abandon interview",
          });
      }
    };
  
  /* =========================================================
     DELETE
  ========================================================= */
  
  export const removeMockInterview =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const userId =
          req.user?.userId;
  
        const id =
          req.params.id;
  
        if (!userId) {
          return res
            .status(401)
            .json({
              success: false,
              message:
                "Unauthorized",
            });
        }
  
        if (
          typeof id !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Invalid interview ID",
            });
        }
  
        await deleteMockInterview(
          id,
          userId
        );
  
        return res.json({
          success: true,
  
          message:
            "Mock interview deleted successfully",
        });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to delete interview",
          });
      }
    };
