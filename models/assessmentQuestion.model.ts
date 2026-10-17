import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type AssessmentQuestionDifficulty =
    | "Easy"
    | "Medium"
    | "Hard";
  
  export type AssessmentQuestionSource =
    | "ai"
    | "manual"
    | "seed";
  
  export interface IAssessmentQuestionBank
    extends Document {
    category: string;
  
    topic: string;
  
    question: string;
  
    normalizedQuestion: string;
  
    options: string[];
  
    correctAnswer: string;
  
    explanation: string;
  
    difficulty:
      AssessmentQuestionDifficulty;
  
    tags: string[];
  
    source:
      AssessmentQuestionSource;
  
    isActive: boolean;
  
    createdBy?: Types.ObjectId;
  
    usageCount: number;
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  const assessmentQuestionSchema =
    new Schema<IAssessmentQuestionBank>(
      {
        category: {
          type: String,
          required: true,
          trim: true,
          index: true,
        },
  
        topic: {
          type: String,
          required: true,
          trim: true,
          default: "General",
          index: true,
        },
  
        question: {
          type: String,
          required: true,
          trim: true,
        },
  
        normalizedQuestion: {
          type: String,
          required: true,
          trim: true,
        },
  
        options: {
          type: [String],
          required: true,
  
          validate: {
            validator:
              (value: string[]) =>
                value.length === 4,
  
            message:
              "Assessment question must contain exactly 4 options",
          },
        },
  
        correctAnswer: {
          type: String,
          required: true,
          trim: true,
        },
  
        explanation: {
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
          index: true,
        },
  
        tags: {
          type: [String],
          default: [],
        },
  
        source: {
          type: String,
  
          enum: [
            "ai",
            "manual",
            "seed",
          ],
  
          default: "ai",
        },
  
        isActive: {
          type: Boolean,
          default: true,
          index: true,
        },
  
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
  
        usageCount: {
          type: Number,
          default: 0,
          min: 0,
        },
      },
      {
        timestamps: true,
      }
    );
  
  assessmentQuestionSchema.index({
    category: 1,
    topic: 1,
    difficulty: 1,
    isActive: 1,
  });
  
  assessmentQuestionSchema.index(
    {
      normalizedQuestion: 1,
    },
    {
      unique: true,
    }
  );
  
  const AssessmentQuestion =
    mongoose.model<IAssessmentQuestionBank>(
      "AssessmentQuestion",
      assessmentQuestionSchema
    );
  
  export default AssessmentQuestion;