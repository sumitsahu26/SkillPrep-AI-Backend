import mongoose, { Document, Schema, Types } from "mongoose";

export type NotificationType =
  | "interview"
  | "mock_interview"
  | "resume"
  | "ai_mentor"
  | "roadmap"
  | "skill_assessment"
  | "system";

export interface INotification extends Document {
  userId: Types.ObjectId;
  title: string;
  description: string;
  type: NotificationType;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
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

    description: {
      type: String,
      required: true,
      trim: true,
    },

    type: {
      type: String,
      enum: [
        "interview",
        "mock_interview",
        "resume",
        "ai_mentor",
        "roadmap",
        "skill_assessment",
        "system",
      ],
      default: "system",
    },

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    link: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.index({
  userId: 1,
  createdAt: -1,
});

const Notification =
  mongoose.models.Notification ||
  mongoose.model<INotification>(
    "Notification",
    notificationSchema
  );

export default Notification;