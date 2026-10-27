import OpenAI from "openai";

import InterviewQuestion from "../models/interview.model";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type AIDifficulty =
  | "Easy"
  | "Medium"
  | "Hard";

export interface GenerateInterviewInput {
  technology: string;
  topic?: string;
  difficulty: AIDifficulty;
  experience: string;
  questionCount: number;
  userId?: string;
}

interface GeneratedInterviewQuestion {
  question: string;
  answer: string;
  category: string;
  topic: string;
  difficulty: AIDifficulty;
  tags: string[];
}

interface AIQuestionResponse {
  questions: GeneratedInterviewQuestion[];
}

  //  NORMALIZE QUESTION

  //  Used for simple duplicate checking.

const normalizeQuestion = (
  value: string
) => {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[?.!]+$/, "");
};

  //  GENERATE + SAVE

export const generateInterviewQuestions =
  async (
    data: GenerateInterviewInput
  ) => {
    const {
      technology,
      topic,
      difficulty,
      experience,
      questionCount,
      userId,
    } = data;

    const model =
      process.env.OPENAI_MODEL;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY is not configured"
      );
    }

    if (!model) {
      throw new Error(
        "OPENAI_MODEL is not configured"
      );
    }

      //  GET EXISTING QUESTIONS

      //  We send some existing questions to AI so that it can try not to generate the same questions again.

    const existingQuestions =
      await InterviewQuestion.find({
        category: technology,
        ...(topic &&
        topic !== "General"
          ? { topic }
          : {}),
        isActive: true,
      })
        .select("question")
        .limit(100)
        .lean();

    const existingQuestionText =
      existingQuestions
        .map(
          (item) =>
            `- ${item.question}`
        )
        .join("\n");

      //  OPENAI

    const response =
      await openai.responses.create({
        model,

        instructions: `
You are an expert technical interviewer for software developers.

Generate practical technical interview questions.

Rules:

1. Questions must be useful in real software-development interviews.

2. Match the requested technology.

3. Match the requested topic.

4. Match the requested difficulty.

5. Match the candidate's experience level.

6. For experienced developers, prefer practical, scenario-based and architecture questions where appropriate.

7. Avoid duplicate questions.

8. Avoid questions that are semantically very similar to the existing questions supplied in the prompt.

9. Answers must be simple, technically accurate and useful for interview preparation.

10. Keep answers concise but sufficiently explanatory.

11. Do not include markdown formatting inside JSON values.

12. Return exactly the requested number of questions whenever possible.
`,

        input: `
Generate interview questions with the following requirements.

Technology:
${technology}

Topic:
${topic || "General"}

Difficulty:
${difficulty}

Candidate experience:
${experience}

Number of questions:
${questionCount}

Existing questions that should NOT be repeated:

${
  existingQuestionText ||
  "No existing questions supplied."
}
`,

        text: {
          format: {
            type: "json_schema",

            name:
              "interview_questions",

            strict: true,

            schema: {
              type: "object",

              additionalProperties:
                false,

              properties: {
                questions: {
                  type: "array",

                  items: {
                    type: "object",

                    additionalProperties:
                      false,

                    properties: {
                      question: {
                        type: "string",
                      },

                      answer: {
                        type: "string",
                      },

                      category: {
                        type: "string",
                      },

                      topic: {
                        type: "string",
                      },

                      difficulty: {
                        type: "string",

                        enum: [
                          "Easy",
                          "Medium",
                          "Hard",
                        ],
                      },

                      tags: {
                        type: "array",

                        items: {
                          type: "string",
                        },
                      },
                    },

                    required: [
                      "question",
                      "answer",
                      "category",
                      "topic",
                      "difficulty",
                      "tags",
                    ],
                  },
                },
              },

              required: [
                "questions",
              ],
            },
          },
        },
      });

    if (!response.output_text) {
      throw new Error(
        "AI did not return interview questions"
      );
    }

    const result = JSON.parse(
      response.output_text
    ) as AIQuestionResponse;

    if (
      !result.questions ||
      result.questions.length === 0
    ) {
      throw new Error(
        "AI returned no questions"
      );
    }

      //  LOAD ALL QUESTIONS NEEDED FOR DUPLICATE CHECKING

    const databaseQuestions =
      await InterviewQuestion.find({
        isActive: true,
      })
        .select("question")
        .lean();

    const normalizedExistingQuestions =
      new Set(
        databaseQuestions.map(
          (item) =>
            normalizeQuestion(
              item.question
            )
        )
      );

    /*
     * Also prevents duplicate questions within
     * the same AI response.
     */
    const currentGenerationQuestions =
      new Set<string>();

    const savedQuestions = [];

      //  SAVE AI QUESTIONS

    for (const generatedQuestion of result.questions) {
      const normalized =
        normalizeQuestion(
          generatedQuestion.question
        );

      if (!normalized) {
        continue;
      }

      /* Already in database */

      if (
        normalizedExistingQuestions.has(
          normalized
        )
      ) {
        continue;
      }

      /* Duplicate in same AI response */

      if (
        currentGenerationQuestions.has(
          normalized
        )
      ) {
        continue;
      }

      currentGenerationQuestions.add(
        normalized
      );

      const question =
        await InterviewQuestion.create({
          category:
            generatedQuestion.category ||
            technology,

          topic:
            generatedQuestion.topic ||
            topic ||
            "General",

          question:
            generatedQuestion.question.trim(),

          answer:
            generatedQuestion.answer.trim(),

          difficulty:
            generatedQuestion.difficulty ||
            difficulty,

          tags:
            generatedQuestion.tags || [],

          source: "ai",

          isActive: true,

          createdBy:
            userId || undefined,
        });

      savedQuestions.push(question);

      normalizedExistingQuestions.add(
        normalized
      );
    }

    return savedQuestions;
  };