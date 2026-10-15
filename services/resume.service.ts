import mongoose from "mongoose";
import Resume from "../models/resume.model";

interface ResumeData {
  title?: string;

  personalInfo?: {
    fullName?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    portfolio?: string;
  };

  summary?: string;

  skills?: string[];

  experience?: {
    company: string;
    position: string;
    location?: string;
    startDate?: string;
    endDate?: string;
    currentlyWorking?: boolean;
    description?: string;
  }[];

  education?: {
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    grade?: string;
    description?: string;
  }[];

  projects?: {
    title: string;
    description?: string;
    technologies?: string[];
    projectUrl?: string;
    githubUrl?: string;
  }[];

  languages?: string[];

  template?: string;
}

/*
|--------------------------------------------------------------------------
| CREATE RESUME
|--------------------------------------------------------------------------
*/

export const createResume = async (
  userId: string,
  data: ResumeData
) => {
  const resume = await Resume.create({
    userId,
    ...data,
  });

  return resume;
};

/*
|--------------------------------------------------------------------------
| GET ALL USER RESUMES
|--------------------------------------------------------------------------
*/

export const getAllResumes = async (userId: string) => {
  const resumes = await Resume.find({
    userId,
  }).sort({
    updatedAt: -1,
  });

  return resumes;
};

/*
|--------------------------------------------------------------------------
| GET SINGLE RESUME
|--------------------------------------------------------------------------
*/

export const getResumeById = async (
  userId: string,
  resumeId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new Error("Invalid resume ID");
  }

  const resume = await Resume.findOne({
    _id: resumeId,
    userId,
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  return resume;
};

/*
|--------------------------------------------------------------------------
| UPDATE RESUME
|--------------------------------------------------------------------------
*/

export const updateResume = async (
  userId: string,
  resumeId: string,
  data: ResumeData
) => {
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new Error("Invalid resume ID");
  }

  const resume = await Resume.findOneAndUpdate(
    {
      _id: resumeId,
      userId,
    },
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!resume) {
    throw new Error("Resume not found");
  }

  return resume;
};

/*
|--------------------------------------------------------------------------
| DELETE RESUME
|--------------------------------------------------------------------------
*/

export const deleteResume = async (
  userId: string,
  resumeId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(resumeId)) {
    throw new Error("Invalid resume ID");
  }

  const resume = await Resume.findOneAndDelete({
    _id: resumeId,
    userId,
  });

  if (!resume) {
    throw new Error("Resume not found");
  }

  return resume;
};