import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type QuestionSource =
    | "manual"
    | "ai"
    | "seed";
  
  export interface IInterviewQuestion
    extends Document {
    category: string;
    topic: string;
    question: string;
    answer: string;
  
    difficulty:
      | "Easy"
      | "Medium"
      | "Hard";
  
    tags: string[];
  
    source: QuestionSource;
  
    isActive: boolean;
  
    createdBy?: Types.ObjectId;
  
    createdAt: Date;
    updatedAt: Date;
  }
  
  const interviewQuestionSchema =
    new Schema<IInterviewQuestion>(
      {
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
  
        question: {
          type: String,
          required: true,
          trim: true,
        },
  
        answer: {
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
          default: "Medium",
        },
  
        tags: {
          type: [String],
          default: [],
        },
  
        source: {
          type: String,
          enum: [
            "manual",
            "ai",
            "seed",
          ],
          default: "manual",
        },
  
        isActive: {
          type: Boolean,
          default: true,
        },
  
        createdBy: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      },
      {
        timestamps: true,
      }
    );
  
  /* Used for category/topic filtering */
  
  interviewQuestionSchema.index({
    category: 1,
    topic: 1,
  });
  
  /* Helps duplicate searching */
  
  interviewQuestionSchema.index({
    question: 1,
  });
  
  const InterviewQuestion =
    mongoose.model<IInterviewQuestion>(
      "InterviewQuestion",
      interviewQuestionSchema
    );
  
  export default InterviewQuestion;