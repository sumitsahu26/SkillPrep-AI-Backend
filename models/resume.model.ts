import mongoose, {
    Document,
    Schema,
    Types,
  } from "mongoose";
  
  export interface IExperience {
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    currentlyWorking?: boolean;
    description?: string;
  }
  
  export interface IEducation {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
    description?: string;
  }
  
  export interface IProject {
    title: string;
    description?: string;
    technologies: string[];
    projectUrl?: string;
    githubUrl?: string;
  }
  
  export interface IResume extends Document {
    userId: Types.ObjectId;
  
    title: string;
  
    personalInfo: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      linkedin?: string;
      github?: string;
      portfolio?: string;
    };
  
    summary?: string;
  
    skills: string[];
  
    experience: IExperience[];
  
    education: IEducation[];
  
    projects: IProject[];
  
    languages: string[];
  
    template?: string;
  }
  
  const experienceSchema = new Schema<IExperience>(
    {
      company: {
        type: String,
        required: true,
        trim: true,
      },
  
      position: {
        type: String,
        required: true,
        trim: true,
      },
  
      location: {
        type: String,
        trim: true,
      },
  
      startDate: {
        type: String,
      },
  
      endDate: {
        type: String,
      },
  
      currentlyWorking: {
        type: Boolean,
        default: false,
      },
  
      description: {
        type: String,
        trim: true,
      },
    },
    {
      _id: true,
    }
  );
  
  const educationSchema = new Schema<IEducation>(
    {
      institution: {
        type: String,
        required: true,
        trim: true,
      },
  
      degree: {
        type: String,
        required: true,
        trim: true,
      },
  
      fieldOfStudy: {
        type: String,
        trim: true,
      },
  
      startDate: {
        type: String,
      },
  
      endDate: {
        type: String,
      },
  
      grade: {
        type: String,
        trim: true,
      },
  
      description: {
        type: String,
        trim: true,
      },
    },
    {
      _id: true,
    }
  );
  
  const projectSchema = new Schema<IProject>(
    {
      title: {
        type: String,
        required: true,
        trim: true,
      },
  
      description: {
        type: String,
        trim: true,
      },
  
      technologies: {
        type: [String],
        default: [],
      },
  
      projectUrl: {
        type: String,
        trim: true,
      },
  
      githubUrl: {
        type: String,
        trim: true,
      },
    },
    {
      _id: true,
    }
  );
  
  const resumeSchema = new Schema<IResume>(
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
        default: "My Resume",
      },
  
      personalInfo: {
        fullName: {
          type: String,
          trim: true,
        },
  
        email: {
          type: String,
          trim: true,
          lowercase: true,
        },
  
        phone: {
          type: String,
          trim: true,
        },
  
        location: {
          type: String,
          trim: true,
        },
  
        linkedin: {
          type: String,
          trim: true,
        },
  
        github: {
          type: String,
          trim: true,
        },
  
        portfolio: {
          type: String,
          trim: true,
        },
      },
  
      summary: {
        type: String,
        trim: true,
      },
  
      skills: {
        type: [String],
        default: [],
      },
  
      experience: {
        type: [experienceSchema],
        default: [],
      },
  
      education: {
        type: [educationSchema],
        default: [],
      },
  
      projects: {
        type: [projectSchema],
        default: [],
      },
  
      languages: {
        type: [String],
        default: [],
      },
  
      template: {
        type: String,
        default: "modern",
      },
    },
    {
      timestamps: true,
    }
  );
  
  const Resume = mongoose.model<IResume>(
    "Resume",
    resumeSchema
  );
  
  export default Resume;