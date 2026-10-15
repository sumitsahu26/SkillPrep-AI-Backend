import mongoose, { Document, Schema, Types } from "mongoose";

export interface IInterviewProgress extends Document {
  userId: Types.ObjectId;
  completedQuestions: Types.ObjectId[];
  bookmarkedQuestions: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const interviewProgressSchema = new Schema<IInterviewProgress>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    completedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "InterviewQuestion",
      },
    ],

    bookmarkedQuestions: [
      {
        type: Schema.Types.ObjectId,
        ref: "InterviewQuestion",
      },
    ],
  },
  {
    timestamps: true,
  }
);

const InterviewProgress = mongoose.model<IInterviewProgress>(
  "InterviewProgress",
  interviewProgressSchema
);

export default InterviewProgress;