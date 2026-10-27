import OpenAI from "openai";

const apiKey =
  process.env.OPENAI_API_KEY;

if (!apiKey) {
  throw new Error(
    "OPENAI_API_KEY is not configured"
  );
}

const openai =
  new OpenAI({
    apiKey,
  });

  //  TYPES

export interface EvaluateAnswerInput {
  technology: string;

  topic: string;

  difficulty:
    | "Easy"
    | "Medium"
    | "Hard";

  experience: string;

  question: string;

  expectedAnswer: string;

  userAnswer: string;
}

export interface AnswerEvaluation {
  score: number;

  feedback: string;

  strengths: string[];

  improvements: string[];

  betterAnswer: string;
}

  //  EVALUATE ANSWER

export const evaluateInterviewAnswer =
  async (
    data: EvaluateAnswerInput
  ): Promise<AnswerEvaluation> => {
    const {
      technology,
      topic,
      difficulty,
      experience,
      question,
      expectedAnswer,
      userAnswer,
    } = data;

    const model =
      process.env.OPENAI_MODEL ||
      "gpt-6-luna";

    const response =
      await openai.responses.create({
        model,

        instructions: `
You are a senior technical interviewer.

Your job is to evaluate a candidate's interview answer.

Evaluate the answer based on:
- Technical correctness
- Relevance
- Completeness
- Clarity
- Practical understanding
- Candidate experience level

Score must be between 0 and 10.

Scoring guide:

0-2:
Incorrect or almost no understanding.

3-4:
Basic understanding but major concepts are missing.

5-6:
Reasonable answer but lacks depth or important details.

7-8:
Good interview answer with solid technical understanding.

9:
Excellent and detailed answer.

10:
Exceptional answer that is accurate, complete, practical and clearly explained.

Important rules:

1. Do not require the candidate to use the exact wording of the expected answer.
2. Accept technically correct alternative explanations.
3. Consider the candidate's experience level.
4. Do not give a high score just because the answer is long.
5. Do not give a low score just because the answer is short if it correctly answers the question.
6. Feedback should be constructive and useful for interview preparation.
7. betterAnswer should sound like a strong candidate speaking in a real interview.
8. Keep betterAnswer concise but sufficiently detailed.
`,

        input: `
Technology:
${technology}

Topic:
${topic}

Difficulty:
${difficulty}

Candidate Experience:
${experience}

Interview Question:
${question}

Reference / Expected Answer:
${expectedAnswer}

Candidate Answer:
${userAnswer}

Evaluate the candidate's answer.
`,

        text: {
          format: {
            type:
              "json_schema",

            name:
              "interview_answer_evaluation",

            strict: true,

            schema: {
              type:
                "object",

              properties: {
                score: {
                  type:
                    "number",

                  minimum:
                    0,

                  maximum:
                    10,
                },

                feedback: {
                  type:
                    "string",
                },

                strengths: {
                  type:
                    "array",

                  items: {
                    type:
                      "string",
                  },
                },

                improvements: {
                  type:
                    "array",

                  items: {
                    type:
                      "string",
                  },
                },

                betterAnswer: {
                  type:
                    "string",
                },
              },

              required: [
                "score",
                "feedback",
                "strengths",
                "improvements",
                "betterAnswer",
              ],

              additionalProperties:
                false,
            },
          },
        },
      });

    if (
      !response.output_text
    ) {
      throw new Error(
        "AI did not return an evaluation"
      );
    }

    const result =
      JSON.parse(
        response.output_text
      ) as AnswerEvaluation;

    /*
     * Extra safety:
     * always keep score 0-10.
     */

    result.score =
      Math.max(
        0,
        Math.min(
          10,
          result.score
        )
      );

    return result;
  };