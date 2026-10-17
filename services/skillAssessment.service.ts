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
  
      const generatedQuestions =
        await generateAssessmentQuestions(
          {
            technology,
  
            topic,
  
            difficulty,
  
            questionCount,
          }
        );
  
      if (
        generatedQuestions.length ===
        0
      ) {
        throw new Error(
          "No assessment questions available"
        );
      }
  
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
  
            questionCount:
              generatedQuestions.length,
  
            questions:
              generatedQuestions.map(
                (question) => ({
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
  
      return assessment;
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