import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type MentorMessageRole =
    | "user"
    | "assistant";
  
  export interface IMentorMessage {
    _id: Types.ObjectId;
  
    role: MentorMessageRole;
  
    content: string;
  
    createdAt: Date;
  }
  
  export interface IAIMentorChat
    extends Document {
    userId: Types.ObjectId;
  
    messages: IMentorMessage[];
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  const mentorMessageSchema =
    new Schema<IMentorMessage>(
      {
        role: {
          type: String,
  
          enum: [
            "user",
            "assistant",
          ],
  
          required: true,
        },
  
        content: {
          type: String,
  
          required: true,
  
          trim: true,
        },
  
        createdAt: {
          type: Date,
  
          default: Date.now,
        },
      },
      {
        _id: true,
      }
    );
  
  const aiMentorChatSchema =
    new Schema<IAIMentorChat>(
      {
        userId: {
          type: Schema.Types.ObjectId,
  
          ref: "User",
  
          required: true,
  
          unique: true,
  
          index: true,
        },
  
        messages: {
          type: [
            mentorMessageSchema,
          ],
  
          default: [],
        },
      },
      {
        timestamps: true,
      }
    );
  
  const AIMentorChat =
    mongoose.model<IAIMentorChat>(
      "AIMentorChat",
      aiMentorChatSchema
    );
  
  export default AIMentorChat;