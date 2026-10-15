import InterviewQuestion from "../models/interview.model";
import { Types } from "mongoose";

interface CreateQuestionData {
  category: string;
  topic: string;
  question: string;
  answer: string;
  difficulty?: "Easy" | "Medium" | "Hard";
  tags?: string[];
  isActive?: boolean;
}

export const createQuestion = async (
  data: CreateQuestionData,
  userId?: string
) => {
  const question = await InterviewQuestion.create({
    ...data,
    createdBy: userId ? new Types.ObjectId(userId) : undefined,
  });

  return question;
};

export const getAllQuestions = async (filters?: {
  category?: string;
  topic?: string;
  difficulty?: string;
}) => {
  const query: Record<string, unknown> = {
    isActive: true,
  };

  if (filters?.category) {
    query.category = filters.category;
  }

  if (filters?.topic) {
    query.topic = filters.topic;
  }

  if (filters?.difficulty) {
    query.difficulty = filters.difficulty;
  }

  return InterviewQuestion.find(query).sort({
    createdAt: -1,
  });
};

export const getQuestionById = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid question ID");
  }

  return InterviewQuestion.findOne({
    _id: id,
    isActive: true,
  });
};

export const updateQuestion = async (
  id: string,
  data: Partial<CreateQuestionData>
) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid question ID");
  }

  return InterviewQuestion.findByIdAndUpdate(
    id,
    {
      $set: data,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

export const deleteQuestion = async (id: string) => {
  if (!Types.ObjectId.isValid(id)) {
    throw new Error("Invalid question ID");
  }

  return InterviewQuestion.findByIdAndUpdate(
    id,
    {
      $set: {
        isActive: false,
      },
    },
    {
      new: true,
    }
  );
};

export const getCategories = async () => {
  return InterviewQuestion.distinct("category", {
    isActive: true,
  });
};

export const getTopicsByCategory = async (category: string) => {
  return InterviewQuestion.distinct("topic", {
    category,
    isActive: true,
  });
};