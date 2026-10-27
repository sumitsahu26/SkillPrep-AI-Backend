import OpenAI from "openai";

import InterviewQuestion from "../models/interview.model";

import AssessmentQuestion from "../models/assessmentQuestion.model";

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
  category: string;

  topic: string;

  question: string;

  options: string[];

  correctAnswer: string;

  explanation: string;

  difficulty:
    AssessmentDifficulty;

  tags: string[];
}

const normalizeQuestion =
  (
    question: string
  ) =>
    question
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ")
      .replace(/[?.!]+$/, "");

  //  CLIENT

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

  //  GENERATE

export const generateAssessmentQuestions =
  async (
    input:
      GenerateAssessmentInput
  ): Promise<
    GeneratedMCQ[]
  > => {
    const {
      technology,
      topic = "General",
      difficulty,
      questionCount,
    } = input;

    if (
      questionCount <= 0
    ) {
      return [];
    }

    const model =
      process.env
        .OPENAI_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_MODEL is not configured"
      );
    }

      //  INTERVIEW BANK CONTEXT

    const interviewQuery:
      Record<
        string,
        unknown
      > = {
      category:
        technology,

      isActive: true,
    };

    if (
      topic !==
      "General"
    ) {
      interviewQuery.topic =
        topic;
    }

    const interviewQuestions =
      await InterviewQuestion.find(
        interviewQuery
      )
        .limit(30)
        .select(
          "question answer topic"
        )
        .lean();

      //  EXISTING MCQS

    const assessmentQuery:
      Record<
        string,
        unknown
      > = {
      category:
        technology,

      isActive: true,
    };

    if (
      topic !==
      "General"
    ) {
      assessmentQuery.topic =
        topic;
    }

    const existingMCQs =
      await AssessmentQuestion.find(
        assessmentQuery
      )
        .limit(200)
        .select(
          "question"
        )
        .lean();

    const interviewContext =
      interviewQuestions
        .map(
          (
            question,
            index
          ) => `
Reference ${index + 1}
Topic: ${question.topic}
Question: ${question.question}
Answer: ${question.answer}
`
        )
        .join("\n");

    const existingQuestionList =
      existingMCQs
        .map(
          (question) =>
            question.question
        )
        .join("\n");

    const openai =
      getOpenAIClient();

    const response =
      await openai.responses.create(
        {
          model,

          instructions: `
You are creating technical MCQ assessment questions for software developers.

Rules:

1. Generate exactly the requested number when possible.
2. Every question must have exactly four options.
3. Exactly one option must be correct.
4. correctAnswer must exactly equal one item in options.
5. Avoid ambiguous questions.
6. Avoid trick questions.
7. Do not use "All of the above".
8. Do not use "None of the above".
9. Match the requested technology.
10. Match the requested difficulty.
11. Prefer practical software-development knowledge.
12. Use realistic code/concept scenarios when appropriate.
13. Do not duplicate any existing MCQ supplied in the prompt.
14. Do not generate duplicate questions within your response.
15. The explanation should explain why the correct answer is correct.
16. tags should contain useful technical keywords.
17. category must match the requested technology.
18. If the requested topic is General, choose useful topics across the technology.
`,

          input: `
Technology:
${technology}

Requested Topic:
${topic}

Difficulty:
${difficulty}

Generate:
${questionCount} NEW questions

Existing Interview Questions For Context:
${
  interviewContext ||
  "No interview question context."
}

Existing Assessment Questions You MUST NOT Duplicate:
${
  existingQuestionList ||
  "No existing assessment questions."
}
`,

          text: {
            format: {
              type:
                "json_schema",

              name:
                "assessment_mcqs",

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
                        category: {
                          type:
                            "string",
                        },

                        topic: {
                          type:
                            "string",
                        },

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

                        tags: {
                          type:
                            "array",

                          items: {
                            type:
                              "string",
                          },
                        },
                      },

                      required: [
                        "category",
                        "topic",
                        "question",
                        "options",
                        "correctAnswer",
                        "explanation",
                        "difficulty",
                        "tags",
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
        "Invalid AI assessment response"
      );
    }

      //  FINAL DUPLICATE PROTECTION

    const existingSet =
      new Set(
        existingMCQs.map(
          (question) =>
            normalizeQuestion(
              question.question
            )
        )
      );

    const currentSet =
      new Set<string>();

    const result:
      GeneratedMCQ[] =
      [];

    for (
      const question of parsed.questions
    ) {
      if (
        !question.question ||
        !Array.isArray(
          question.options
        ) ||
        question.options
          .length !== 4 ||
        !question.options.includes(
          question.correctAnswer
        )
      ) {
        continue;
      }

      const normalized =
        normalizeQuestion(
          question.question
        );

      if (
        existingSet.has(
          normalized
        ) ||
        currentSet.has(
          normalized
        )
      ) {
        continue;
      }

      currentSet.add(
        normalized
      );

      result.push({
        ...question,

        category:
          technology,

        topic:
          topic !==
          "General"
            ? topic
            : question.topic ||
              "General",

        difficulty,
      });
    }

    return result.slice(
      0,
      questionCount
    );
  };