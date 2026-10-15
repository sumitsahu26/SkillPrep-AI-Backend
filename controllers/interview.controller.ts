import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  getCategories,
  getTopicsByCategory,
} from "../services/interview.service";

export const createInterviewQuestion = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const userId = req.user?.userId;

    const {
      category,
      topic,
      question,
      answer,
      difficulty,
      tags,
      isActive,
    } = req.body;

    if (!category || !topic || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: "Category, topic, question and answer are required",
      });
    }

    const newQuestion = await createQuestion(
      {
        category,
        topic,
        question,
        answer,
        difficulty,
        tags,
        isActive,
      },
      userId
    );

    return res.status(201).json({
      success: true,
      message: "Interview question created successfully",
      question: newQuestion,
    });
  } catch (error) {
    console.error("Create interview question error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create interview question",
    });
  }
};

export const getInterviewQuestions = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const { category, topic, difficulty } = req.query;

    const questions = await getAllQuestions({
      category: category as string | undefined,
      topic: topic as string | undefined,
      difficulty: difficulty as string | undefined,
    });

    return res.status(200).json({
      success: true,
      count: questions.length,
      questions,
    });
  } catch (error) {
    console.error("Get interview questions error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get interview questions",
    });
  }
};

export const getInterviewQuestion = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }
    
    const question = await getQuestionById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    return res.status(200).json({
      success: true,
      question,
    });
  } catch (error) {
    console.error("Get interview question error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get interview question",
    });
  }
};

export const updateInterviewQuestion = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await updateQuestion(id, req.body);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview question updated successfully",
      question,
    });
  } catch (error) {
    console.error("Update interview question error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update interview question",
    });
  }
};

export const deleteInterviewQuestion = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const { id } = req.params;

    if (typeof id !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid question ID",
      });
    }

    const question = await deleteQuestion(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Interview question not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Interview question deleted successfully",
    });
  } catch (error) {
    console.error("Delete interview question error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete interview question",
    });
  }
};

export const getInterviewCategories = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const categories = await getCategories();

    return res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error("Get interview categories error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get interview categories",
    });
  }
};

export const getInterviewTopics = async (
    req: AuthRequest,
    res: Response
) => {
  try {
    const { category } = req.params;

    if (typeof category !== "string") {
      return res.status(400).json({
        success: false,
        message: "Invalid Category",
      });
    }

    const topics = await getTopicsByCategory(category);

    return res.status(200).json({
      success: true,
      category,
      topics,
    });
  } catch (error) {
    console.error("Get interview topics error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get interview topics",
    });
  }
};