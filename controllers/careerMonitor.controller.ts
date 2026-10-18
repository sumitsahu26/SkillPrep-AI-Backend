import {
    Response,
  } from "express";
  
  import {
    AuthRequest,
  } from "../middleware/auth.middleware";
  
  import {
    analyzeCareer,
    deleteCareerSnapshot,
    getCareerHistory,
    getCareerSnapshot,
    getCurrentCareerMetrics,
  } from "../services/careerMonitor.service";
  
  /* =========================================================
     CURRENT
  ========================================================= */
  
  export const getCurrentCareerMonitor =
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
  
        const data =
          await getCurrentCareerMetrics(
            userId
          );
  
        return res.json({
          success: true,
          data,
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to calculate career metrics",
          });
      }
    };
  
  /* =========================================================
     ANALYZE
  ========================================================= */
  
  export const generateCareerMonitorAnalysis =
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
  
        const analysis =
          await analyzeCareer(
            userId
          );
  
        return res
          .status(201)
          .json({
            success: true,
  
            message:
              "Career analysis generated successfully",
  
            analysis,
          });
      } catch (error) {
        console.error(
          "Career monitor analysis:",
          error
        );
  
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to analyze career readiness",
          });
      }
    };
  
  /* =========================================================
     HISTORY
  ========================================================= */
  
  export const getCareerMonitorHistory =
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
  
        const history =
          await getCareerHistory(
            userId
          );
  
        return res.json({
          success: true,
  
          count:
            history.length,
  
          history,
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              "Failed to load career monitor history",
          });
      }
    };
  
  /* =========================================================
     HISTORY ITEM
  ========================================================= */
  
  export const getCareerMonitorSnapshot =
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
  
        const analysis =
          await getCareerSnapshot(
            id,
            userId
          );
  
        return res.json({
          success: true,
          analysis,
        });
      } catch (error) {
        return res
          .status(404)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Analysis not found",
          });
      }
    };
  
  /* =========================================================
     DELETE
  ========================================================= */
  
  export const removeCareerMonitorSnapshot =
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
  
        await deleteCareerSnapshot(
          id,
          userId
        );
  
        return res.json({
          success: true,
  
          message:
            "Career analysis deleted successfully",
        });
      } catch (error) {
        return res
          .status(400)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to delete analysis",
          });
      }
    };