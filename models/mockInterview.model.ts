import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type MockInterviewDifficulty =
    | "Easy"
    | "Medium"
    | "Hard";
  
  export type MockInterviewStatus =
    | "in_progress"
    | "completed"
    | "abandoned";
  
  export type MockQuestionSource =
    | "database"
    | "ai";
  
  // QUESTION INTERFACE
  
  export interface IMockInterviewQuestion {
    questionId?: Types.ObjectId;
  
    question: string;
  
    expectedAnswer: string;
  
    userAnswer: string;
  
    category: string;
  
    topic: string;
  
    difficulty: MockInterviewDifficulty;
  
    source: MockQuestionSource;
  
    score?: number;
  
    feedback?: string;
  
    strengths?: string[];
  
    improvements?: string[];
  
    betterAnswer?: string;
  
    answeredAt?: Date;
  }
  
  
    //  MAIN INTERFACE
 
  
  export interface IMockInterview
    extends Document {
    userId: Types.ObjectId;
  
    title: string;
  
    technology: string;
  
    topic: string;
  
    difficulty: MockInterviewDifficulty;
  
    experience: string;
  
    questionCount: number;
  
    questions: IMockInterviewQuestion[];
  
    currentQuestionIndex: number;
  
    status: MockInterviewStatus;
  
    totalScore: number;
  
    percentage: number;
  
    overallFeedback?: string;
  
    strengths: string[];
  
    improvements: string[];
  
    startedAt: Date;
  
    completedAt?: Date;
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  
    //  QUESTION SCHEMA
 
  
  const mockInterviewQuestionSchema =
    new Schema<IMockInterviewQuestion>(
      {
        questionId: {
          type: Schema.Types.ObjectId,
  
          ref: "InterviewQuestion",
        },
  
        question: {
          type: String,
  
          required: true,
  
          trim: true,
        },
  
        expectedAnswer: {
          type: String,
  
          required: true,
  
          trim: true,
        },
  
        userAnswer: {
          type: String,
  
          default: "",
  
          trim: true,
        },
  
        category: {
          type: String,
  
          required: true,
  
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
  
        source: {
          type: String,
  
          enum: [
            "database",
            "ai",
          ],
  
          default: "database",
        },
  
        score: {
          type: Number,
  
          min: 0,
  
          max: 10,
  
          default: 0,
        },
  
        feedback: {
          type: String,
  
          default: "",
        },
  
        strengths: {
          type: [String],
  
          default: [],
        },
  
        improvements: {
          type: [String],
  
          default: [],
        },
  
        betterAnswer: {
          type: String,
  
          default: "",
        },
  
        answeredAt: {
          type: Date,
        },
      },
      {
        _id: true,
      }
    );
  
  
    //  MOCK INTERVIEW SCHEMA
 
  
  const mockInterviewSchema =
    new Schema<IMockInterview>(
      {
        userId: {
          type: Schema.Types.ObjectId,
  
          ref: "User",
  
          required: true,
  
          index: true,
        },
  
        title: {
          type: String,
  
          required: true,
  
          trim: true,
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
  
        experience: {
          type: String,
  
          required: true,
  
          trim: true,
        },
  
        questionCount: {
          type: Number,
  
          required: true,
  
          min: 1,
  
          max: 20,
        },
  
        questions: {
          type: [
            mockInterviewQuestionSchema,
          ],
  
          default: [],
        },
  
        currentQuestionIndex: {
          type: Number,
  
          default: 0,
  
          min: 0,
        },
  
        status: {
          type: String,
  
          enum: [
            "in_progress",
            "completed",
            "abandoned",
          ],
  
          default: "in_progress",
        },
  
        totalScore: {
          type: Number,
  
          default: 0,
  
          min: 0,
        },
  
        percentage: {
          type: Number,
  
          default: 0,
  
          min: 0,
  
          max: 100,
        },
  
        overallFeedback: {
          type: String,
  
          default: "",
        },
  
        strengths: {
          type: [String],
  
          default: [],
        },
  
        improvements: {
          type: [String],
  
          default: [],
        },
  
        startedAt: {
          type: Date,
  
          default: Date.now,
        },
  
        completedAt: {
          type: Date,
        },
      },
  
      {
        timestamps: true,
      }
    );
  
  
    //  INDEXES
 
  
  mockInterviewSchema.index({
    userId: 1,
    createdAt: -1,
  });
  
  mockInterviewSchema.index({
    userId: 1,
    status: 1,
  });
  
  mockInterviewSchema.index({
    technology: 1,
    difficulty: 1,
  });
  
  
    //  MODEL
 
  
  const MockInterview =
    mongoose.model<IMockInterview>(
      "MockInterview",
      mockInterviewSchema
    );
  
  export default MockInterview;