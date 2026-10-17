import {
    Response,
  } from "express";
  
  import {
    AuthRequest,
  } from "../middleware/auth.middleware";
  
  import AssessmentQuestion from "../models/assessmentQuestion.model";
  
  /* =========================================================
     GET QUESTIONS
  ========================================================= */
  
  export const getAssessmentQuestions =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const {
          category,
          topic,
          difficulty,
          source,
        } = req.query;
  
        const query: Record<
          string,
          unknown
        > = {
          isActive: true,
        };
  
        if (
          typeof category ===
          "string" &&
          category
        ) {
          query.category =
            category;
        }
  
        if (
          typeof topic ===
          "string" &&
          topic
        ) {
          query.topic =
            topic;
        }
  
        if (
          typeof difficulty ===
          "string" &&
          difficulty
        ) {
          query.difficulty =
            difficulty;
        }
  
        if (
          typeof source ===
          "string" &&
          source
        ) {
          query.source =
            source;
        }
  
        const questions =
          await AssessmentQuestion.find(
            query
          )
            .sort({
              createdAt: -1,
            })
            .select(
              "-correctAnswer"
            );
  
        return res.json({
          success: true,
  
          count:
            questions.length,
  
          questions,
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              error instanceof Error
                ? error.message
                : "Failed to load assessment questions",
          });
      }
    };
  
  /* =========================================================
     CATEGORIES
  ========================================================= */
  
  export const getAssessmentCategories =
    async (
      _req: AuthRequest,
      res: Response
    ) => {
      try {
        const categories =
          await AssessmentQuestion.distinct(
            "category",
            {
              isActive: true,
            }
          );
  
        return res.json({
          success: true,
  
          categories:
            categories.sort(),
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              "Failed to load categories",
          });
      }
    };
  
  /* =========================================================
     TOPICS
  ========================================================= */
  
  export const getAssessmentTopics =
    async (
      req: AuthRequest,
      res: Response
    ) => {
      try {
        const {
          category,
        } = req.params;
  
        if (
          typeof category !==
          "string"
        ) {
          return res
            .status(400)
            .json({
              success: false,
  
              message:
                "Invalid category",
            });
        }
  
        const topics =
          await AssessmentQuestion.distinct(
            "topic",
            {
              category,
  
              isActive: true,
            }
          );
  
        return res.json({
          success: true,
  
          topics:
            topics.sort(),
        });
      } catch (error) {
        return res
          .status(500)
          .json({
            success: false,
  
            message:
              "Failed to load topics",
          });
      }
    };