import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type AssessmentDifficulty =
    | "Easy"
    | "Medium"
    | "Hard";
  
  export type AssessmentStatus =
    | "in_progress"
    | "completed";
  
  export type SkillLevel =
    | "Beginner"
    | "Intermediate"
    | "Advanced"
    | "Expert";
  
  export interface IAssessmentQuestion {
    _id: Types.ObjectId;
  
    question: string;
  
    options: string[];
  
    correctAnswer: string;
  
    explanation: string;
  
    topic: string;
  
    difficulty:
      AssessmentDifficulty;
  
    selectedAnswer: string;
  
    isCorrect: boolean;
  }
  
  export interface ITopicPerformance {
    topic: string;
  
    total: number;
  
    correct: number;
  
    percentage: number;
  }
  
  export interface ISkillAssessment
    extends Document {
    userId: Types.ObjectId;
  
    technology: string;
  
    topic: string;
  
    difficulty:
      AssessmentDifficulty;
  
    questionCount: number;
  
    questions:
      IAssessmentQuestion[];
  
    status:
      AssessmentStatus;
  
    score: number;
  
    percentage: number;
  
    skillLevel: SkillLevel;
  
    topicPerformance:
      ITopicPerformance[];
  
    strongAreas: string[];
  
    improvementAreas: string[];
  
    startedAt: Date;
  
    completedAt?: Date;
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  /* =========================================================
     QUESTION
  ========================================================= */
  
  const assessmentQuestionSchema =
    new Schema<IAssessmentQuestion>(
      {
        question: {
          type: String,
          required: true,
          trim: true,
        },
  
        options: {
          type: [String],
          required: true,
  
          validate: {
            validator:
              (
                value: string[]
              ) =>
                value.length ===
                4,
  
            message:
              "Each question must have exactly 4 options",
          },
        },
  
        correctAnswer: {
          type: String,
          required: true,
          trim: true,
        },
  
        explanation: {
          type: String,
          default: "",
          trim: true,
        },
  
        topic: {
          type: String,
          required: true,
          trim: true,
        },
  
        difficulty: {
          type: String,
  
          enum: [
            "Easy",
            "Medium",
            "Hard",
          ],
  
          required: true,
        },
  
        selectedAnswer: {
          type: String,
          default: "",
        },
  
        isCorrect: {
          type: Boolean,
          default: false,
        },
      },
      {
        _id: true,
      }
    );
  
  /* =========================================================
     TOPIC PERFORMANCE
  ========================================================= */
  
  const topicPerformanceSchema =
    new Schema<ITopicPerformance>(
      {
        topic: {
          type: String,
          required: true,
        },
  
        total: {
          type: Number,
          default: 0,
        },
  
        correct: {
          type: Number,
          default: 0,
        },
  
        percentage: {
          type: Number,
          default: 0,
        },
      },
      {
        _id: false,
      }
    );
  
  /* =========================================================
     ASSESSMENT
  ========================================================= */
  
  const skillAssessmentSchema =
    new Schema<ISkillAssessment>(
      {
        userId: {
          type: Schema.Types.ObjectId,
  
          ref: "User",
  
          required: true,
  
          index: true,
        },
  
        technology: {
          type: String,
          required: true,
          trim: true,
        },
  
        topic: {
          type: String,
          default: "General",
          trim: true,
        },
  
        difficulty: {
          type: String,
  
          enum: [
            "Easy",
            "Medium",
            "Hard",
          ],
  
          required: true,
        },
  
        questionCount: {
          type: Number,
  
          required: true,
  
          min: 1,
  
          max: 50,
        },
  
        questions: {
          type: [
            assessmentQuestionSchema,
          ],
  
          default: [],
        },
  
        status: {
          type: String,
  
          enum: [
            "in_progress",
            "completed",
          ],
  
          default:
            "in_progress",
        },
  
        score: {
          type: Number,
          default: 0,
        },
  
        percentage: {
          type: Number,
          default: 0,
        },
  
        skillLevel: {
          type: String,
  
          enum: [
            "Beginner",
            "Intermediate",
            "Advanced",
            "Expert",
          ],
  
          default:
            "Beginner",
        },
  
        topicPerformance: {
          type: [
            topicPerformanceSchema,
          ],
  
          default: [],
        },
  
        strongAreas: {
          type: [String],
          default: [],
        },
  
        improvementAreas: {
          type: [String],
          default: [],
        },
  
        startedAt: {
          type: Date,
  
          default:
            Date.now,
        },
  
        completedAt: {
          type: Date,
        },
      },
      {
        timestamps: true,
      }
    );
  
  skillAssessmentSchema.index({
    userId: 1,
    createdAt: -1,
  });
  
  skillAssessmentSchema.index({
    userId: 1,
    technology: 1,
  });
  
  skillAssessmentSchema.index({
    userId: 1,
    status: 1,
  });
  
  const SkillAssessment =
    mongoose.model<ISkillAssessment>(
      "SkillAssessment",
      skillAssessmentSchema
    );
  
  export default SkillAssessment;