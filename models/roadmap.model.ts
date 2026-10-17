import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type RoadmapStatus =
    | "not_started"
    | "in_progress"
    | "completed";
  
  export type RoadmapResourceType =
    | "documentation"
    | "practice"
    | "project"
    | "video"
    | "other";
  
  export interface IRoadmapResource {
    title: string;
    type: RoadmapResourceType;
    url?: string;
  }
  
  export interface IRoadmapTopic {
    _id: Types.ObjectId;
    title: string;
    description: string;
    completed: boolean;
    completedAt?: Date;
  }
  
  export interface IRoadmapStep {
    _id: Types.ObjectId;
    week: number;
    title: string;
    description: string;
    topics: IRoadmapTopic[];
    resources: IRoadmapResource[];
    completed: boolean;
    completedAt?: Date;
  }
  
  export interface IRoadmap
    extends Document {
    userId: Types.ObjectId;
  
    title: string;
  
    targetRole: string;
  
    experience: string;
  
    durationWeeks: number;
  
    currentSkills: string[];
  
    targetSkills: string[];
  
    steps: IRoadmapStep[];
  
    status: RoadmapStatus;
  
    progress: number;
  
    source: "ai" | "manual";
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  /* =========================================================
     RESOURCE
  ========================================================= */
  
  const resourceSchema =
    new Schema<IRoadmapResource>(
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
  
        type: {
          type: String,
          enum: [
            "documentation",
            "practice",
            "project",
            "video",
            "other",
          ],
          default: "other",
        },
  
        url: {
          type: String,
          trim: true,
        },
      },
      {
        _id: false,
      }
    );
  
  /* =========================================================
     TOPIC
  ========================================================= */
  
  const topicSchema =
    new Schema<IRoadmapTopic>(
      {
        title: {
          type: String,
          required: true,
          trim: true,
        },
  
        description: {
          type: String,
          default: "",
          trim: true,
        },
  
        completed: {
          type: Boolean,
          default: false,
        },
  
        completedAt: {
          type: Date,
        },
      },
      {
        _id: true,
      }
    );
  
  /* =========================================================
     STEP
  ========================================================= */
  
  const roadmapStepSchema =
    new Schema<IRoadmapStep>(
      {
        week: {
          type: Number,
          required: true,
          min: 1,
        },
  
        title: {
          type: String,
          required: true,
          trim: true,
        },
  
        description: {
          type: String,
          default: "",
          trim: true,
        },
  
        topics: {
          type: [topicSchema],
          default: [],
        },
  
        resources: {
          type: [resourceSchema],
          default: [],
        },
  
        completed: {
          type: Boolean,
          default: false,
        },
  
        completedAt: {
          type: Date,
        },
      },
      {
        _id: true,
      }
    );
  
  /* =========================================================
     ROADMAP
  ========================================================= */
  
  const roadmapSchema =
    new Schema<IRoadmap>(
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
  
        targetRole: {
          type: String,
          required: true,
          trim: true,
        },
  
        experience: {
          type: String,
          required: true,
          trim: true,
        },
  
        durationWeeks: {
          type: Number,
          required: true,
          min: 1,
          max: 52,
        },
  
        currentSkills: {
          type: [String],
          default: [],
        },
  
        targetSkills: {
          type: [String],
          default: [],
        },
  
        steps: {
          type: [roadmapStepSchema],
          default: [],
        },
  
        status: {
          type: String,
          enum: [
            "not_started",
            "in_progress",
            "completed",
          ],
          default: "not_started",
        },
  
        progress: {
          type: Number,
          default: 0,
          min: 0,
          max: 100,
        },
  
        source: {
          type: String,
          enum: ["ai", "manual"],
          default: "ai",
        },
      },
      {
        timestamps: true,
      }
    );
  
  roadmapSchema.index({
    userId: 1,
    createdAt: -1,
  });
  
  roadmapSchema.index({
    userId: 1,
    status: 1,
  });
  
  const Roadmap =
    mongoose.model<IRoadmap>(
      "Roadmap",
      roadmapSchema
    );
  
  export default Roadmap;