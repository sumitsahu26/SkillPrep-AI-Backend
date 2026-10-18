import {
    Response,
  } from "express";
  
  import {
    AuthRequest,
  } from "../middleware/auth.middleware";
  
  import {
    clearMentorHistory,
    getMentorHistory,
    sendMentorMessage,
  } from "../services/aiMentor.service";
  
  /* =========================================================
     CHAT
  ========================================================= */
  
  export const chatWithMentor =
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
  
        const { message } =
          req.body;
  
        if (
          typeof message !==
            "string" ||
          !message.trim()
        ) {
          return res
            .status(400)
            .json({
              success: false,
  
              message:
                "Message is required",
            });
        }
  
        const result =
          await sendMentorMessage(
            userId,
            message
          );
  
        return res.json({
          success: true,
  
          message:
            result.message,
  
          chatId:
            result.chatId,
        });
      } catch (error) {
        console.error(
          "AI Mentor chat error:",
          error
        );
  
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to get AI Mentor response",
          });
      }
    };
  
  /* =========================================================
     HISTORY
  ========================================================= */
  
  export const mentorHistory =
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
  
        const messages =
          await getMentorHistory(
            userId
          );
  
        return res.json({
          success: true,
  
          messages,
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              "Failed to load chat history",
          });
      }
    };
  
  /* =========================================================
     CLEAR
  ========================================================= */
  
  export const clearMentorChat =
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
  
        await clearMentorHistory(
          userId
        );
  
        return res.json({
          success: true,
  
          message:
            "Chat history cleared successfully",
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              "Failed to clear chat history",
          });
      }
    };