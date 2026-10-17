import {
    Types,
  } from "mongoose";
  
  import SkillAssessment, {
    IAssessmentQuestion,
    ITopicPerformance,
    SkillLevel,
  } from "../models/skillAssessment.model";
  
  import {
    AssessmentDifficulty,
    generateAssessmentQuestions,
  } from "./aiAssessment.service";

  import AssessmentQuestion from "../models/assessmentQuestion.model";

import {
  getRandomAssessmentQuestions,
  incrementAssessmentQuestionUsage,
  saveGeneratedAssessmentQuestions,
} from "./assessmentQuestion.service";
  
  /* =========================================================
     TYPES
  ========================================================= */
  
  export interface StartAssessmentInput {
    userId: string;
  
    technology: string;
  
    topic?: string;
  
    difficulty:
      AssessmentDifficulty;
  
    questionCount: number;
  }
  
  export interface AssessmentAnswer {
    questionId: string;
  
    selectedAnswer: string;
  }
  
  /* =========================================================
     SKILL LEVEL
  ========================================================= */
  
  const calculateSkillLevel =
    (
      percentage: number
    ): SkillLevel => {
      if (
        percentage >= 90
      ) {
        return "Expert";
      }
  
      if (
        percentage >= 75
      ) {
        return "Advanced";
      }
  
      if (
        percentage >= 50
      ) {
        return "Intermediate";
      }
  
      return "Beginner";
    };
  
  /* =========================================================
     START
  ========================================================= */
  
  export const startSkillAssessment =
  async (
    data: StartAssessmentInput
  ) => {
    const {
      userId,
      technology,
      topic = "General",
      difficulty,
      questionCount,
    } = data;

    if (
      !Types.ObjectId.isValid(
        userId
      )
    ) {
      throw new Error(
        "Invalid user ID"
      );
    }

    /* =====================================================
       STEP 1
       GET QUESTIONS FROM DATABASE
    ===================================================== */

    let bankQuestions =
      await getRandomAssessmentQuestions(
        {
          category:
            technology,

          topic,

          difficulty,

          limit:
            questionCount,
        }
      );

      const initialDatabaseCount =
         bankQuestions.length;

    /* =====================================================
       STEP 2
       FIND HOW MANY ARE MISSING
    ===================================================== */

    const missingCount =
    Math.max(
      questionCount -
        initialDatabaseCount,
      0
    );

    /* =====================================================
       STEP 3
       GENERATE ONLY MISSING QUESTIONS
    ===================================================== */

    if (
      missingCount >
      0
    ) {
      try {
        const generated =
          await generateAssessmentQuestions(
            {
              technology,

              topic,

              difficulty,

              questionCount:
                missingCount,
            }
          );

        /*
         * Save generated questions
         * permanently into the MCQ
         * Question Bank.
         */

        await saveGeneratedAssessmentQuestions(
          generated,
          userId
        );

        /*
         * Re-query so our final
         * selection comes from the
         * actual saved DB documents.
         */

        bankQuestions =
          await getRandomAssessmentQuestions(
            {
              category:
                technology,

              topic,

              difficulty,

              limit:
                questionCount,
            }
          );
      } catch (error) {
        /*
         * AI failure should NOT
         * destroy the assessment
         * if DB questions exist.
         */

        console.error(
          "Assessment AI generation failed:",
          error
        );
      }
    }

    /* =====================================================
       STEP 4
       FALLBACK
    ===================================================== */

    if (
      bankQuestions.length ===
      0
    ) {
      throw new Error(
        "No assessment questions are currently available for this selection."
      );
    }

    const finalQuestions =
      bankQuestions.slice(
        0,
        questionCount
      );

    /* =====================================================
       STEP 5
       CREATE ASSESSMENT SNAPSHOT
    ===================================================== */
    

    const assessment =
      await SkillAssessment.create(
        {
          userId:
            new Types.ObjectId(
              userId
            ),

          technology,

          topic,

          difficulty,

          /*
           * Actual count may be
           * lower if AI failed.
           */

          questionCount:
            finalQuestions.length,

          questions:
            finalQuestions.map(
              (question) => ({
                questionId:
                  question._id,

                question:
                  question.question,

                options:
                  question.options,

                correctAnswer:
                  question.correctAnswer,

                explanation:
                  question.explanation,

                topic:
                  question.topic,

                difficulty:
                  question.difficulty,

                selectedAnswer:
                  "",

                isCorrect:
                  false,
              })
            ),

          status:
            "in_progress",

          startedAt:
            new Date(),
        }
      );

    /* =====================================================
       STEP 6
       TRACK BANK USAGE
    ===================================================== */

    await incrementAssessmentQuestionUsage(
      finalQuestions.map(
        (question) =>
          new Types.ObjectId(
            question._id
          )
      )
    );

    return {
        assessment,
      
        requestedQuestionCount:
          questionCount,
      
        actualQuestionCount:
          finalQuestions.length,
      
        databaseQuestionCount:
          Math.min(
            initialDatabaseCount,
            finalQuestions.length
          ),
      
        generatedCount:
          Math.max(
            finalQuestions.length -
              initialDatabaseCount,
            0
          ),
      
        usedFallback:
          finalQuestions.length <
          questionCount,
      };
  };
  
  /* =========================================================
     SUBMIT
  ========================================================= */
  
  export const submitSkillAssessment =
    async (
      assessmentId: string,
      userId: string,
      answers:
        AssessmentAnswer[]
    ) => {
      if (
        !Types.ObjectId.isValid(
          assessmentId
        )
      ) {
        throw new Error(
          "Invalid assessment ID"
        );
      }
  
      const assessment =
        await SkillAssessment.findOne(
          {
            _id:
              assessmentId,
  
            userId,
          }
        );
  
      if (!assessment) {
        throw new Error(
          "Assessment not found"
        );
      }
  
      if (
        assessment.status ===
        "completed"
      ) {
        throw new Error(
          "Assessment has already been submitted"
        );
      }
  
      const answerMap =
        new Map<
          string,
          string
        >();
  
      for (
        const answer of answers
      ) {
        if (
          !answer.questionId
        ) {
          continue;
        }
  
        answerMap.set(
          answer.questionId,
          answer.selectedAnswer ||
            ""
        );
      }
  
      let score = 0;
  
      for (
        const question of assessment.questions
      ) {
        const selectedAnswer =
          answerMap.get(
            question._id.toString()
          ) || "";
  
        question.selectedAnswer =
          selectedAnswer;
  
        question.isCorrect =
          Boolean(
            selectedAnswer &&
              selectedAnswer ===
                question.correctAnswer
          );
  
        if (
          question.isCorrect
        ) {
          score += 1;
        }
      }
  
      const total =
        assessment.questions
          .length;
  
      const percentage =
        total > 0
          ? Math.round(
              (score /
                total) *
                100
            )
          : 0;
  
      /* =====================================================
         TOPIC PERFORMANCE
      ===================================================== */
  
      const topicMap =
        new Map<
          string,
          {
            total: number;
            correct: number;
          }
        >();
  
      for (
        const question of assessment.questions
      ) {
        const topicName =
          question.topic ||
          "General";
  
        const current =
          topicMap.get(
            topicName
          ) || {
            total: 0,
            correct: 0,
          };
  
        current.total +=
          1;
  
        if (
          question.isCorrect
        ) {
          current.correct +=
            1;
        }
  
        topicMap.set(
          topicName,
          current
        );
      }
  
      const topicPerformance:
        ITopicPerformance[] =
        [];
  
      for (
        const [
          topicName,
          stats,
        ] of topicMap.entries()
      ) {
        topicPerformance.push(
          {
            topic:
              topicName,
  
            total:
              stats.total,
  
            correct:
              stats.correct,
  
            percentage:
              stats.total >
              0
                ? Math.round(
                    (stats.correct /
                      stats.total) *
                      100
                  )
                : 0,
          }
        );
      }
  
      const strongAreas =
        topicPerformance
          .filter(
            (item) =>
              item.percentage >=
              75
          )
          .map(
            (item) =>
              item.topic
          );
  
      const improvementAreas =
        topicPerformance
          .filter(
            (item) =>
              item.percentage <
              75
          )
          .map(
            (item) =>
              item.topic
          );
  
      assessment.score =
        score;
  
      assessment.percentage =
        percentage;
  
      assessment.skillLevel =
        calculateSkillLevel(
          percentage
        );
  
      assessment.topicPerformance =
        topicPerformance;
  
      assessment.strongAreas =
        strongAreas;
  
      assessment.improvementAreas =
        improvementAreas;
  
      assessment.status =
        "completed";
  
      assessment.completedAt =
        new Date();
  
      await assessment.save();
  
      return assessment;
    };
  
  /* =========================================================
     GET USER ASSESSMENTS
  ========================================================= */
  
  export const getUserSkillAssessments =
    async (
      userId: string
    ) => {
      if (
        !Types.ObjectId.isValid(
          userId
        )
      ) {
        throw new Error(
          "Invalid user ID"
        );
      }
  
      return SkillAssessment.find(
        {
          userId,
        }
      )
        .sort({
          createdAt: -1,
        })
        .select(
          "-questions.correctAnswer -questions.explanation"
        );
    };
  
  /* =========================================================
     GET ONE
  ========================================================= */
  
  export const getSkillAssessmentById =
    async (
      assessmentId: string,
      userId: string
    ) => {
      if (
        !Types.ObjectId.isValid(
          assessmentId
        )
      ) {
        throw new Error(
          "Invalid assessment ID"
        );
      }
  
      const assessment =
        await SkillAssessment.findOne(
          {
            _id:
              assessmentId,
  
            userId,
          }
        );
  
      if (!assessment) {
        throw new Error(
          "Assessment not found"
        );
      }
  
      return assessment;
    };
  
  /* =========================================================
     DELETE
  ========================================================= */
  
  export const deleteSkillAssessment =
    async (
      assessmentId: string,
      userId: string
    ) => {
      if (
        !Types.ObjectId.isValid(
          assessmentId
        )
      ) {
        throw new Error(
          "Invalid assessment ID"
        );
      }
  
      const assessment =
        await SkillAssessment.findOneAndDelete(
          {
            _id:
              assessmentId,
  
            userId,
          }
        );
  
      if (!assessment) {
        throw new Error(
          "Assessment not found"
        );
      }
  
      return assessment;
    };

    export const sanitizeAssessment =
  (
    assessment: any
  ) => {
    const data =
      typeof assessment.toObject ===
      "function"
        ? assessment.toObject()
        : assessment;

    if (
      data.status ===
      "completed"
    ) {
      return data;
    }

    return {
      ...data,

      questions:
        data.questions.map(
          (question: any) => {
            const {
              correctAnswer,
              explanation,
              isCorrect,
              ...safeQuestion
            } = question;

            return safeQuestion;
          }
        ),
    };
  };