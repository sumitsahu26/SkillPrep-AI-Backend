import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export type CareerPriority =
    | "high"
    | "medium"
    | "low";
  
  export type CareerRecommendationModule =
    | "resume-builder"
    | "interview-preparation"
    | "mock-interview"
    | "roadmap"
    | "skill-assessment"
    | "ai-mentor";
  
  export interface ICareerMetrics {
    resume: number;
    interviewPreparation: number;
    mockInterview: number;
    skillAssessment: number;
    roadmap: number;
  }
  
  export interface ICareerRecommendation {
    title: string;
    description: string;
    priority: CareerPriority;
    module: CareerRecommendationModule;
  }
  
  export interface ICareerMonitor
    extends Document {
    userId: Types.ObjectId;
  
    targetRole: string;
  
    readinessScore: number;
  
    metrics: ICareerMetrics;
  
    strongSkills: string[];
  
    weakSkills: string[];
  
    aiAnalysis: string;
  
    recommendations:
      ICareerRecommendation[];
  
    generatedAt: Date;
  
    createdAt: Date;
  
    updatedAt: Date;
  }
  
  const metricsSchema =
    new Schema<ICareerMetrics>(
      {
        resume: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
  
        interviewPreparation: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
  
        mockInterview: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
  
        skillAssessment: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
  
        roadmap: {
          type: Number,
          min: 0,
          max: 100,
          default: 0,
        },
      },
      {
        _id: false,
      }
    );
  
  const recommendationSchema =
    new Schema<ICareerRecommendation>(
      {
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
  
        priority: {
          type: String,
          enum: [
            "high",
            "medium",
            "low",
          ],
          required: true,
        },
  
        module: {
          type: String,
  
          enum: [
            "resume-builder",
            "interview-preparation",
            "mock-interview",
            "roadmap",
            "skill-assessment",
            "ai-mentor",
          ],
  
          required: true,
        },
      },
      {
        _id: false,
      }
    );
  
  const careerMonitorSchema =
    new Schema<ICareerMonitor>(
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true,
          index: true,
        },
  
        targetRole: {
          type: String,
          required: true,
          trim: true,
        },
  
        readinessScore: {
          type: Number,
          min: 0,
          max: 100,
          required: true,
        },
  
        metrics: {
          type: metricsSchema,
          required: true,
        },
  
        strongSkills: {
          type: [String],
          default: [],
        },
  
        weakSkills: {
          type: [String],
          default: [],
        },
  
        aiAnalysis: {
          type: String,
          default: "",
        },
  
        recommendations: {
          type: [
            recommendationSchema,
          ],
          default: [],
        },
  
        generatedAt: {
          type: Date,
          default: Date.now,
        },
      },
      {
        timestamps: true,
      }
    );
  
  careerMonitorSchema.index({
    userId: 1,
    generatedAt: -1,
  });
  
  const CareerMonitor =
    mongoose.model<ICareerMonitor>(
      "CareerMonitor",
      careerMonitorSchema
    );
  
  export default CareerMonitor;