import OpenAI from "openai";

import InterviewQuestion from "../models/interview.model";

export type AssessmentDifficulty =
  | "Easy"
  | "Medium"
  | "Hard";

export interface GenerateAssessmentInput {
  technology: string;

  topic?: string;

  difficulty:
    AssessmentDifficulty;

  questionCount: number;
}

export interface GeneratedMCQ {
  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  topic: string;

  difficulty:
    AssessmentDifficulty;
}

const getOpenAIClient =
  () => {
    const apiKey =
      process.env
        .OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured"
      );
    }

    return new OpenAI({
      apiKey,
    });
  };

/* =========================================================
   GENERATE ASSESSMENT QUESTIONS
========================================================= */

export const generateAssessmentQuestions =
  async (
    input: GenerateAssessmentInput
  ): Promise<GeneratedMCQ[]> => {
    const {
      technology,
      topic = "General",
      difficulty,
      questionCount,
    } = input;

    const model =
      process.env.OPENAI_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_MODEL is not configured"
      );
    }

    /*
     * Use existing interview
     * questions as context.
     */

    const query: Record<
      string,
      unknown
    > = {
      category:
        technology,

      isActive: true,
    };

    if (
      topic &&
      topic !== "General"
    ) {
      query.topic =
        topic;
    }

    const existingQuestions =
      await InterviewQuestion.find(
        query
      )
        .limit(50)
        .select(
          "question answer topic difficulty"
        )
        .lean();

    const context =
      existingQuestions
        .map(
          (
            item,
            index
          ) => `
Question ${index + 1}
Topic: ${item.topic}
Question: ${item.question}
Reference Answer: ${item.answer}
`
        )
        .join("\n");

    const openai =
      getOpenAIClient();

    const response =
      await openai.responses.create(
        {
          model,

          instructions: `
You are creating a technical skill assessment for software developers.

Generate multiple-choice technical questions.

Requirements:

1. Every question must have exactly 4 options.
2. Exactly one option must be correct.
3. correctAnswer must exactly match one of the options.
4. Questions must test real technical understanding.
5. Avoid trick questions.
6. Avoid duplicate questions.
7. Avoid ambiguous answers.
8. Use practical scenarios where appropriate.
9. Match the requested difficulty.
10. Keep explanations concise but educational.
11. Do not create questions where multiple options could reasonably be correct.
12. Do not use options such as "All of the above" or "None of the above".
13. The question must relate to the requested technology.
14. Use the provided question bank only as context. Do not simply copy every question.
`,

          input: `
Technology:
${technology}

Topic:
${topic}

Difficulty:
${difficulty}

Number of questions:
${questionCount}

Existing interview question bank:

${
  context ||
  "No existing questions available."
}

Generate ${questionCount} unique MCQ questions.
`,

          text: {
            format: {
              type:
                "json_schema",

              name:
                "skill_assessment_questions",

              strict: true,

              schema: {
                type:
                  "object",

                properties: {
                  questions: {
                    type:
                      "array",

                    items: {
                      type:
                        "object",

                      properties: {
                        question: {
                          type:
                            "string",
                        },

                        options: {
                          type:
                            "array",

                          items: {
                            type:
                              "string",
                          },

                          minItems: 4,

                          maxItems: 4,
                        },

                        correctAnswer:
                          {
                            type:
                              "string",
                          },

                        explanation:
                          {
                            type:
                              "string",
                          },

                        topic: {
                          type:
                            "string",
                        },

                        difficulty:
                          {
                            type:
                              "string",

                            enum: [
                              "Easy",
                              "Medium",
                              "Hard",
                            ],
                          },
                      },

                      required: [
                        "question",
                        "options",
                        "correctAnswer",
                        "explanation",
                        "topic",
                        "difficulty",
                      ],

                      additionalProperties:
                        false,
                    },
                  },
                },

                required: [
                  "questions",
                ],

                additionalProperties:
                  false,
              },
            },
          },
        }
      );

    if (
      !response.output_text
    ) {
      throw new Error(
        "AI did not generate assessment questions"
      );
    }

    const parsed =
      JSON.parse(
        response.output_text
      ) as {
        questions:
          GeneratedMCQ[];
      };

    if (
      !Array.isArray(
        parsed.questions
      )
    ) {
      throw new Error(
        "Invalid assessment response"
      );
    }

    const validQuestions =
      parsed.questions.filter(
        (question) => {
          if (
            !question.question ||
            !Array.isArray(
              question.options
            ) ||
            question.options
              .length !== 4
          ) {
            return false;
          }

          return question.options.includes(
            question.correctAnswer
          );
        }
      );

    if (
      validQuestions.length ===
      0
    ) {
      throw new Error(
        "AI did not generate valid questions"
      );
    }

    return validQuestions.slice(
      0,
      questionCount
    );
  };