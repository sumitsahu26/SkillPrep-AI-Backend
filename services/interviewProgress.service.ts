import { Types } from "mongoose";
import InterviewProgress from "../models/interviewProgress.model";

const validateQuestionId = (questionId: string) => {
  if (!Types.ObjectId.isValid(questionId)) {
    throw new Error("Invalid question ID");
  }
};

export const getUserInterviewProgress = async (
  userId: string
) => {
  let progress = await InterviewProgress.findOne({
    userId,
  });

  if (!progress) {
    progress = await InterviewProgress.create({
      userId,
      completedQuestions: [],
      bookmarkedQuestions: [],
    });
  }

  return progress;
};

export const toggleCompletedQuestion = async (
  userId: string,
  questionId: string
) => {
  validateQuestionId(questionId);

  const progress = await getUserInterviewProgress(userId);

  const alreadyCompleted = progress.completedQuestions.some(
    (id) => id.toString() === questionId
  );

  if (alreadyCompleted) {
    progress.completedQuestions =
      progress.completedQuestions.filter(
        (id) => id.toString() !== questionId
      );
  } else {
    progress.completedQuestions.push(
      new Types.ObjectId(questionId)
    );
  }

  await progress.save();

  return progress;
};

export const toggleBookmarkedQuestion = async (
  userId: string,
  questionId: string
) => {
  validateQuestionId(questionId);

  const progress = await getUserInterviewProgress(userId);

  const alreadyBookmarked = progress.bookmarkedQuestions.some(
    (id) => id.toString() === questionId
  );

  if (alreadyBookmarked) {
    progress.bookmarkedQuestions =
      progress.bookmarkedQuestions.filter(
        (id) => id.toString() !== questionId
      );
  } else {
    progress.bookmarkedQuestions.push(
      new Types.ObjectId(questionId)
    );
  }

  await progress.save();

  return progress;
};