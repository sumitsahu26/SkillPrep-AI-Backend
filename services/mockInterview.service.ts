import { Types } from "mongoose";

import MockInterview, {
    IMockInterviewQuestion,
    MockQuestionSource,
} from "../models/mockInterview.model";
import InterviewQuestion from "../models/interview.model";
import { createNotification } from "./notification.service";
import { sendEmail } from "./email.service";
import { getMockInterviewResultEmailTemplate } from "../templates/emails/mockInterviewResultEmail";
import User from "../models/user.model";


import {
    generateInterviewQuestions,
} from "./aiInterview.service";

import {
    evaluateInterviewAnswer,
} from "./aiMockEvaluation.service";

// TYPES

export type MockInterviewDifficulty =
    | "Easy"
    | "Medium"
    | "Hard";

export interface StartMockInterviewInput {

    userId: string;

    technology: string;

    topic?: string;

    difficulty: MockInterviewDifficulty;

    experience: string;

    questionCount: number;

}

// QUESTION QUERY

const buildQuestionQuery = (
    technology: string,
    topic: string | undefined,
    difficulty: MockInterviewDifficulty
) => {
    const query: Record<
        string,
        unknown
    > = {
        category: technology,

        difficulty,

        isActive: true,
    };

    /*
     * General means questions from
     * every topic under the technology.
     */

    if (
        topic &&
        topic !== "General"
    ) {
        query.topic = topic;
    }

    return query;
};

// GET RANDOM QUESTIONS

const getRandomQuestions =
    async (
        technology: string,
        topic: string | undefined,
        difficulty: MockInterviewDifficulty,
        count: number
    ) => {
        const query =
            buildQuestionQuery(
                technology,
                topic,
                difficulty
            );

        return InterviewQuestion.aggregate([
            {
                $match: query,
            },

            {
                $sample: {
                    size: count,
                },
            },
        ]);
    };

// START MOCK INTERVIEW

export const startMockInterview =
    async (
        data: StartMockInterviewInput
    ) => {
        const {
            userId,
            technology,
            topic,
            difficulty,
            experience,
            questionCount,
        } = data;

        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            throw new Error(
                "Invalid user ID"
            );
        }

        //    STEP 1
        //    GET EXISTING DATABASE QUESTIONS

        let questions =
            await getRandomQuestions(
                technology,
                topic,
                difficulty,
                questionCount
            );

        //    STEP 2
        //    CHECK HOW MANY ARE MISSING

        const missingCount =
            Math.max(
                questionCount -
                questions.length,
                0
            );

        //    STEP 3
        //    GENERATE ONLY MISSING QUESTIONS

        if (missingCount > 0) {
            try {
                console.log(
                    `Mock interview needs ${missingCount} additional question(s). Generating with AI...`
                );

                await generateInterviewQuestions(
                    {
                        technology,

                        topic:
                            topic ||
                            "General",

                        difficulty,

                        experience,

                        questionCount:
                            missingCount,

                        userId,
                    }
                );

                /*
                 * generateInterviewQuestions()
                 * already saves new AI questions
                 * into InterviewQuestion.
                 *
                 * So after generation, simply
                 * query MongoDB again.
                 */

                questions =
                    await getRandomQuestions(
                        technology,
                        topic,
                        difficulty,
                        questionCount
                    );
            } catch (error) {
                /*
                 * AI failure should NOT destroy
                 * the mock interview feature.
                 *
                 * We will continue using whatever
                 * MongoDB questions are available.
                 */

                console.error(
                    "Mock interview AI generation failed:",
                    error
                );
            }
        }

        //    STEP 4
        //    CHECK FINAL QUESTION COUNT

        if (
            questions.length === 0
        ) {
            throw new Error(
                `No questions are available for ${technology}${topic &&
                    topic !== "General"
                    ? ` - ${topic}`
                    : ""
                } at ${difficulty} difficulty.`
            );
        }

        /*
         * If AI quota/error happened but we already
         * have some database questions, we still
         * create the interview using those questions.
         */

        const finalQuestionCount =
            Math.min(
                questions.length,
                questionCount
            );

        questions =
            questions.slice(
                0,
                finalQuestionCount
            );

        //    STEP 5
        //    CONVERT TO MOCK QUESTIONS

        const interviewQuestions: Omit<
            IMockInterviewQuestion,
            "_id"
        >[] = questions.map(
            (question) => {
                const source: MockQuestionSource =
                    question.source === "ai"
                        ? "ai"
                        : "database";

                return {
                    questionId:
                        new Types.ObjectId(
                            question._id
                        ),

                    question:
                        question.question,

                    expectedAnswer:
                        question.answer,

                    userAnswer: "",

                    category:
                        question.category,

                    topic:
                        question.topic,

                    difficulty:
                        question.difficulty as MockInterviewDifficulty,

                    source,

                    score: 0,

                    feedback: "",

                    strengths: [],

                    improvements: [],

                    betterAnswer: "",
                };
            }
        );

        //    STEP 6
        //    CREATE INTERVIEW

        const interview =
            await MockInterview.create({
                userId:
                    new Types.ObjectId(
                        userId
                    ),

                title:
                    `${technology} Mock Interview`,

                technology,

                topic:
                    topic ||
                    "General",

                difficulty,

                experience,

                /*
                 * Important:
                 *
                 * Store actual question count,
                 * because AI could have failed.
                 */

                questionCount:
                    interviewQuestions.length,

                questions:
                    interviewQuestions,

                currentQuestionIndex:
                    0,

                status:
                    "in_progress",

                totalScore:
                    0,

                percentage:
                    0,

                strengths: [],

                improvements: [],

                startedAt:
                    new Date(),
            });

        if (interview) {
            await createNotification({
                userId,
                title: "Mock interview completed",
                description:
                    "Your mock interview has been completed. Check your results and feedback.",
                type: "interview",
                link: "/mock-interview",
            });
        }

        return {
            interview,

            requestedQuestionCount:
                questionCount,

            actualQuestionCount:
                interviewQuestions.length,

            usedFallback:
                interviewQuestions.length <
                questionCount,
        };
    };

// GET USER MOCK INTERVIEWS

export const getUserMockInterviews =
    async (
        userId: string
    ) => {
        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            throw new Error(
                "Invalid user ID"
            );
        }

        return MockInterview.find({
            userId,
        })
            .sort({
                createdAt: -1,
            })
            .select(
                "-questions.expectedAnswer"
            );
    };

// GET INTERVIEW BY ID

export const getMockInterviewById =
    async (
        interviewId: string,
        userId: string
    ) => {
        if (
            !Types.ObjectId.isValid(
                interviewId
            )
        ) {
            throw new Error(
                "Invalid interview ID"
            );
        }

        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            throw new Error(
                "Invalid user ID"
            );
        }

        const interview =
            await MockInterview.findOne({
                _id:
                    interviewId,

                userId,
            });

        if (!interview) {
            throw new Error(
                "Mock interview not found"
            );
        }

        return interview;
    };

// SUBMIT + AI EVALUATE ANSWER

export const submitMockInterviewAnswer =
    async (
        interviewId: string,
        userId: string,
        questionId: string,
        userAnswer: string
    ) => {

        //    VALIDATION


        if (
            !Types.ObjectId.isValid(
                interviewId
            )
        ) {
            throw new Error(
                "Invalid interview ID"
            );
        }

        if (
            !Types.ObjectId.isValid(
                userId
            )
        ) {
            throw new Error(
                "Invalid user ID"
            );
        }

        if (
            !Types.ObjectId.isValid(
                questionId
            )
        ) {
            throw new Error(
                "Invalid question ID"
            );
        }

        if (!userAnswer.trim()) {
            throw new Error(
                "Answer is required"
            );
        }

        //    FIND INTERVIEW

        const interview =
            await MockInterview.findOne({
                _id:
                    interviewId,

                userId,
            });

        if (!interview) {
            throw new Error(
                "Mock interview not found"
            );
        }

        if (
            interview.status !==
            "in_progress"
        ) {
            throw new Error(
                "This interview is no longer active"
            );
        }

        //    FIND QUESTION

        const question =
            interview.questions.find(
                (item) =>
                    item._id.toString() ===
                    questionId
            );

        if (!question) {
            throw new Error(
                "Question not found in this interview"
            );
        }

        //    SAVE USER ANSWER FIRST

        question.userAnswer =
            userAnswer.trim();

        question.answeredAt =
            new Date();

        /*
         * Save before AI call.
         *
         * Important:
         * If OpenAI is unavailable,
         * the user's answer is still safe.
         */

        await interview.save();

        //    AI EVALUATION

        let evaluationSuccessful =
            false;

        try {
            const evaluation =
                await evaluateInterviewAnswer(
                    {
                        technology:
                            interview.technology,

                        topic:
                            question.topic ||
                            interview.topic,

                        difficulty:
                            question.difficulty,

                        experience:
                            interview.experience,

                        question:
                            question.question,

                        expectedAnswer:
                            question.expectedAnswer,

                        userAnswer:
                            question.userAnswer,
                    }
                );

            //    SAVE AI RESULT

            question.score =
                evaluation.score;

            question.feedback =
                evaluation.feedback;

            question.strengths =
                evaluation.strengths;

            question.improvements =
                evaluation.improvements;

            question.betterAnswer =
                evaluation.betterAnswer;

            evaluationSuccessful =
                true;
        } catch (error) {
            /*
             * Do NOT block interview when
             * OpenAI quota/API fails.
             */

            console.error(
                "AI answer evaluation failed:",
                error
            );

            question.feedback =
                "AI evaluation is currently unavailable. Your answer has been saved.";

            question.score = 0;

            question.strengths =
                [];

            question.improvements =
                [];

            question.betterAnswer =
                "";
        }

        //    MOVE CURRENT QUESTION

        const questionIndex =
            interview.questions.findIndex(
                (item) =>
                    item._id.toString() ===
                    questionId
            );

        if (
            questionIndex >=
            interview.currentQuestionIndex
        ) {
            interview.currentQuestionIndex =
                Math.min(
                    questionIndex + 1,
                    interview.questions.length
                );
        }

        //    UPDATE CURRENT TOTAL SCORE

        const evaluatedQuestions =
            interview.questions.filter(
                (item) =>
                    item.userAnswer
                        ?.trim()
            );

        const totalScore =
            evaluatedQuestions.reduce(
                (
                    total,
                    item
                ) =>
                    total +
                    (item.score || 0),
                0
            );

        interview.totalScore =
            totalScore;

        /*
         * Calculate percentage only from
         * currently answered questions.
         */

        const maxCurrentScore =
            evaluatedQuestions.length *
            10;

        interview.percentage =
            maxCurrentScore > 0
                ? Math.round(
                    (totalScore /
                        maxCurrentScore) *
                    100
                )
                : 0;

        await interview.save();

        return {
            interview,

            evaluationSuccessful,

            evaluation: {
                score:
                    question.score,

                feedback:
                    question.feedback,

                strengths:
                    question.strengths,

                improvements:
                    question.improvements,

                betterAnswer:
                    question.betterAnswer,
            },
        };
    };

// COMPLETE MOCK INTERVIEW

export const completeMockInterview =
    async (
        interviewId: string,
        userId: string
    ) => {
        if (
            !Types.ObjectId.isValid(
                interviewId
            )
        ) {
            throw new Error(
                "Invalid interview ID"
            );
        }

        const interview =
            await MockInterview.findOne({
                _id:
                    interviewId,

                userId,
            });

        if (!interview) {
            throw new Error(
                "Mock interview not found"
            );
        }

        if (
            interview.status ===
            "completed"
        ) {
            throw new Error(
                "Mock interview is already completed"
            );
        }

        const answeredQuestions =
            interview.questions.filter(
                (question) =>
                    question.userAnswer
                        ?.trim()
            );

        if (
            answeredQuestions.length ===
            0
        ) {
            throw new Error(
                "Please answer at least one question before completing the interview"
            );
        }

        const totalScore =
            interview.questions.reduce(
                (
                    total,
                    question
                ) => {
                    return (
                        total +
                        (question.score ||
                            0)
                    );
                },
                0
            );

        const maxScore =
            interview.questions.length *
            10;

        const percentage =
            maxScore > 0
                ? Math.round(
                    (totalScore /
                        maxScore) *
                    100
                )
                : 0;

        interview.totalScore =
            totalScore;

        interview.percentage =
            percentage;

        interview.status =
            "completed";

        interview.completedAt =
            new Date();

        interview.currentQuestionIndex =
            interview.questions.length;

        await interview.save();

        try {
            const user = await User.findById(userId).select("name email");

            if (user?.email) {
                const technology =
                    interview.technology || "Mock Interview";

                await sendEmail({
                    to: user.email,
                    subject: `Your ${technology} Mock Interview Results`,
                    html: getMockInterviewResultEmailTemplate({
                        userName: user.name,
                        technology,
                        score: percentage,
                        totalQuestions: interview.questions.length,
                        correctAnswers: answeredQuestions.length,
                    }),
                });
            }
        } catch (emailError) {
            console.error(
                "Mock interview result email failed:",
                emailError
            );
        }

        return interview;
    };

// ABANDON INTERVIEW

export const abandonMockInterview =
    async (
        interviewId: string,
        userId: string
    ) => {
        if (
            !Types.ObjectId.isValid(
                interviewId
            )
        ) {
            throw new Error(
                "Invalid interview ID"
            );
        }

        const interview =
            await MockInterview.findOne({
                _id:
                    interviewId,

                userId,
            });

        if (!interview) {
            throw new Error(
                "Mock interview not found"
            );
        }

        if (
            interview.status ===
            "completed"
        ) {
            throw new Error(
                "Completed interview cannot be abandoned"
            );
        }

        interview.status =
            "abandoned";

        await interview.save();

        return interview;
    };

// DELETE INTERVIEW

export const deleteMockInterview =
    async (
        interviewId: string,
        userId: string
    ) => {
        if (
            !Types.ObjectId.isValid(
                interviewId
            )
        ) {
            throw new Error(
                "Invalid interview ID"
            );
        }

        const interview =
            await MockInterview.findOneAndDelete(
                {
                    _id:
                        interviewId,

                    userId,
                }
            );

        if (!interview) {
            throw new Error(
                "Mock interview not found"
            );
        }

        return interview;
    };