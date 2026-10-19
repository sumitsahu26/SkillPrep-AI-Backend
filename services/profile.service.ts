import Profile from "../models/profile.model";
import User from "../models/user.model";

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

export const getProfile = async (userId: string) => {
  const [user, profile] = await Promise.all([
    User.findById(userId).select("name email"),
    Profile.findOne({ userId }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  return {
    user: {
      name: user.name,
      email: user.email,
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