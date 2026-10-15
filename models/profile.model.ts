import mongoose, { Document, Schema, Types } from "mongoose";

export interface IProfile extends Document {
  userId: Types.ObjectId;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  currentRole?: string;
  experience?: number;
  skills: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

const profileSchema = new Schema<IProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    location: {
      type: String,
      trim: true,
    },

    headline: {
      type: String,
      trim: true,
    },

    bio: {
      type: String,
      trim: true,
    },

    currentRole: {
      type: String,
      trim: true,
    },

    experience: {
      type: Number,
      min: 0,
      default: 0,
    },

    skills: {
      type: [String],
      default: [],
    },

    github: {
      type: String,
      trim: true,
    },

    linkedin: {
      type: String,
      trim: true,
    },

    portfolio: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

const Profile = mongoose.model<IProfile>("Profile", profileSchema);

export default Profile;