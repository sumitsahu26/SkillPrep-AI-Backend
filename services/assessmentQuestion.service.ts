import {
    Types,
  } from "mongoose";
  
  import AssessmentQuestion from "../models/assessmentQuestion.model";
  
  import type {
    GeneratedMCQ,
  } from "./aiAssessment.service";
  
  export const normalizeAssessmentQuestion =
    (
      question: string
    ) => {
      return question
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/[?.!]+$/, "");
    };
  
    //  RANDOM QUESTIONS
  
  export const getRandomAssessmentQuestions =
    async ({
      category,
      topic,
      difficulty,
      limit,
      excludeIds = [],
    }: {
      category: string;
  
      topic?: string;
  
      difficulty:
        "Easy"
        | "Medium"
        | "Hard";
  
      limit: number;
  
      excludeIds?: string[];
    }) => {
      if (limit <= 0) {
        return [];
      }
  
      const match: Record<
        string,
        unknown
      > = {
        category,
        difficulty,
        isActive: true,
      };
  
      if (
        topic &&
        topic !== "General"
      ) {
        match.topic = topic;
      }
  
      if (
        excludeIds.length >
        0
      ) {
        match._id = {
          $nin:
            excludeIds
              .filter(
                (id) =>
                  Types.ObjectId.isValid(
                    id
                  )
              )
              .map(
                (id) =>
                  new Types.ObjectId(
                    id
                  )
              ),
        };
      }
  
      return AssessmentQuestion.aggregate(
        [
          {
            $match:
              match,
          },
  
          {
            $sample: {
              size: limit,
            },
          },
        ]
      );
    };
  
    //  GET EXISTING QUESTION TEXT
  
  export const getExistingAssessmentQuestionTexts =
    async (
      category: string,
      topic?: string
    ) => {
      const query: Record<
        string,
        unknown
      > = {
        category,
        isActive: true,
      };
  
      if (
        topic &&
        topic !== "General"
      ) {
        query.topic =
          topic;
      }
  
      const questions =
        await AssessmentQuestion.find(
          query
        )
          .select(
            "question normalizedQuestion"
          )
          .limit(500)
          .lean();
  
      return questions;
    };
  
    //  SAVE GENERATED QUESTIONS
  
  export const saveGeneratedAssessmentQuestions =
    async (
      questions:
        GeneratedMCQ[],
      userId?: string
    ) => {
      const saved = [];
  
      for (
        const question of questions
      ) {
        const normalized =
          normalizeAssessmentQuestion(
            question.question
          );
  
        if (!normalized) {
          continue;
        }
  
        /*
         * Double check:
         * correct answer must be one
         * of the four options.
         */
  
        if (
          !Array.isArray(
            question.options
          ) ||
          question.options
            .length !== 4 ||
          !question.options.includes(
            question.correctAnswer
          )
        ) {
          continue;
        }
  
        try {
          const existing =
            await AssessmentQuestion.findOne(
              {
                normalizedQuestion:
                  normalized,
              }
            );
  
          if (existing) {
            saved.push(
              existing
            );
  
            continue;
          }
  
          const created =
            await AssessmentQuestion.create(
              {
                category:
                  question.category,
  
                topic:
                  question.topic ||
                  "General",
  
                question:
                  question.question.trim(),
  
                normalizedQuestion:
                  normalized,
  
                options:
                  question.options,
  
                correctAnswer:
                  question.correctAnswer,
  
                explanation:
                  question.explanation,
  
                difficulty:
                  question.difficulty,
  
                tags:
                  question.tags ||
                  [],
  
                source: "ai",
  
                isActive:
                  true,
  
                createdBy:
                  userId &&
                  Types.ObjectId.isValid(
                    userId
                  )
                    ? new Types.ObjectId(
                        userId
                      )
                    : undefined,
              }
            );
  
          saved.push(
            created
          );
        } catch (error: any) {
          /*
           * Duplicate can happen if
           * two requests create the
           * same question concurrently.
           */
  
          if (
            error?.code ===
            11000
          ) {
            const existing =
              await AssessmentQuestion.findOne(
                {
                  normalizedQuestion:
                    normalized,
                }
              );
  
            if (existing) {
              saved.push(
                existing
              );
            }
  
            continue;
          }
  
          throw error;
        }
      }
  
      return saved;
    };
  
    //  INCREMENT USAGE
  
  export const incrementAssessmentQuestionUsage =
    async (
      ids: Types.ObjectId[]
    ) => {
      if (
        ids.length === 0
      ) {
        return;
      }
  
      await AssessmentQuestion.updateMany(
        {
          _id: {
            $in: ids,
          },
        },
        {
          $inc: {
            usageCount: 1,
          },
        }
      );
    };