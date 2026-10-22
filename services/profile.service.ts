import Profile from "../models/profile.model";
import User from "../models/user.model";
import fs from "fs/promises";
import path from "path";
import pdfParse from "pdf-parse";
import mammoth from "mammoth";

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ProfileData {
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  currentRole?: string;
  experience?: number;
  skills?: string[];
  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export interface ExtractedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  headline?: string;
  bio?: string;
  currentRole?: string;
  experience?: number;

  skills?: string[];

  github?: string;
  linkedin?: string;
  portfolio?: string;
}

export const getProfile = async (userId: string) => {
  const [user, profile] = await Promise.all([
    User.findById(userId).select("name email profileImage"),
    Profile.findOne({ userId }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    user: {
      name: user.name,
      email: user.email,
      profileImage: user.profileImage
    },
    profile,
  };
};

export const updateProfile = async (
  userId: string,
  data: ProfileData
) => {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    {
      $set: data,
      $setOnInsert: {
        userId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return profile;
};

export const addSkill = async (
  userId: string,
  skill: string
) => {
  const trimmedSkill = skill.trim();

  if (!trimmedSkill) {
    throw new Error("Skill is required");
  }

  let profile = await Profile.findOne({ userId });

  if (!profile) {
    profile = await Profile.create({
      userId,
      skills: [],
    });
  }

  const skillExists = profile.skills.some(
    (existingSkill) =>
      existingSkill.toLowerCase() === trimmedSkill.toLowerCase()
  );

  if (skillExists) {
    throw new Error("Skill already exists");
  }

  profile.skills.push(trimmedSkill);

  await profile.save();

  return profile;
};

export const removeSkill = async (
  userId: string,
  skill: string
) => {
  const profile = await Profile.findOne({ userId });

  if (!profile) {
    throw new Error("Profile not found");
  }

  const skillExists = profile.skills.some(
    (existingSkill) =>
      existingSkill.toLowerCase() === skill.toLowerCase()
  );

  if (!skillExists) {
    throw new Error("Skill not found");
  }

  profile.skills = profile.skills.filter(
    (existingSkill) =>
      existingSkill.toLowerCase() !== skill.toLowerCase()
  );

  await profile.save();

  return profile;
};

export const updateProfileImage = async (
  userId: string,
  profileImage: string
) => {
  const user = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        profileImage,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select("_id name email profileImage");

  return user;
};

export const uploadResumeService = async (
  userId: string,
  resumeFile: string,
  resumeBuffer: Buffer
) => {
  const user = await User.findById(userId).select(
    "_id name email profileImage resume"
  );

  if (!user) {
    throw new Error("User not found");
  }

  // Extract resume text
  const resumeText = await extractResumeText(
    resumeBuffer,
    resumeFile
  );

  if (!resumeText.trim()) {
    throw new Error(
      "Could not extract text from resume"
    );
  }

  // Extract structured details
  const extractedData =
    await extractResumeDetails(resumeText);

  // Name and email required
  if (
    !extractedData.name ||
    !extractedData.email
  ) {
    throw new Error(
      "Resume must contain your name and email"
    );
  }

  // Validate name
  const userName = user.name
    .trim()
    .toLowerCase();

  const resumeName = extractedData.name
    .trim()
    .toLowerCase();

  if (userName !== resumeName) {
    throw new Error(
      "Resume name does not match your account name"
    );
  }

  // Validate email
  const userEmail = user.email
    .trim()
    .toLowerCase();

  const resumeEmail = extractedData.email
    .trim()
    .toLowerCase();

  if (userEmail !== resumeEmail) {
    throw new Error(
      "Resume email does not match your account email"
    );
  }

  // Save resume in User
  const updatedUser =
    await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          resume: resumeFile,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      "_id name email profileImage resume"
    );

  if (!updatedUser) {
    throw new Error("User not found");
  }

  // Update profile
  const profile =
    await updateProfileFromResume(
      userId,
      extractedData
    );

  return {
    user: updatedUser,
    profile,
    extractedData,
  };
};

export const updateProfileFromResume = async (
  userId: string,
  data: ExtractedResumeData
) => {
  const profile = await Profile.findOneAndUpdate(
    { userId },
    {
      $set: {
        phone: data.phone || "",
        location: data.location || "",
        headline: data.headline || "",
        bio: data.bio || "",
        currentRole: data.currentRole || "",
        experience: data.experience || 0,
        skills: data.skills || [],
        github: data.github || "",
        linkedin: data.linkedin || "",
        portfolio: data.portfolio || "",
      },
      $setOnInsert: {
        userId,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    }
  );

  return profile;
};

export const extractResumeText = async (
  buffer: Buffer,
  fileName: string
): Promise<string> => {
  const extension = path
    .extname(fileName)
    .toLowerCase();

  if (extension === ".pdf") {
    const result = await pdfParse(buffer);

    return result.text;
  }

  if (extension === ".docx") {
    const result =
      await mammoth.extractRawText({
        buffer,
      });

    return result.value;
  }

  if (extension === ".doc") {
    throw new Error(
      "DOC files are not supported. Please upload PDF or DOCX."
    );
  }

  throw new Error(
    "Unsupported resume format"
  );
};

export const extractResumeDetails = async (
  resumeText: string
): Promise<ExtractedResumeData> => {
  const prompt = `
You are a resume parser.

Extract information from the resume text below.

Return ONLY valid JSON.
Do not return markdown.
Do not return explanations.

Required JSON structure:

{
  "name": "",
  "email": "",
  "phone": "",
  "location": "",
  "headline": "",
  "bio": "",
  "currentRole": "",
  "experience": 0,
  "skills": [],
  "github": "",
  "linkedin": "",
  "portfolio": ""
}

Rules:

1. Extract the person's actual name.
2. Extract the person's email.
3. Extract phone number if available.
4. Extract location if available.
5. Create a short professional headline.
6. Create a short professional bio based only on the resume.
7. Extract the current/latest job role.
8. Calculate total professional experience in years.
9. Extract technical and professional skills.
10. Extract GitHub URL if available.
11. Extract LinkedIn URL if available.
12. Extract portfolio URL if available.
13. If a field does not exist, return an empty string.
14. For experience, return a number.
15. Do not invent information.

Resume:

${resumeText}
`;

  const response =
    await openai.chat.completions.create({
      model: "gpt-4o-mini",

      messages: [
        {
          role: "system",
          content:
            "You are an expert resume parser. Return only valid JSON.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],

      temperature: 0,
      response_format: {
        type: "json_object",
      },
    });

  const content =
    response.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "Failed to extract resume details"
    );
  }

  return JSON.parse(
    content
  ) as ExtractedResumeData;
};

