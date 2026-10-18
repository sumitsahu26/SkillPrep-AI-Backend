import OpenAI from "openai";

export interface CareerMetricsInput {
  resume: number;

  interviewPreparation: number;

  mockInterview: number;

  skillAssessment: number;

  roadmap: number;
}

export interface CareerAIInput {
  targetRole: string;

  readinessScore: number;

  metrics:
    CareerMetricsInput;

  strongSkills: string[];

  weakSkills: string[];

  recentAssessmentSummary: string;

  recentMockSummary: string;
}

export interface AICareerRecommendation {
  title: string;

  description: string;

  priority:
    | "high"
    | "medium"
    | "low";

  module:
    | "resume-builder"
    | "interview-preparation"
    | "mock-interview"
    | "roadmap"
    | "skill-assessment"
    | "ai-mentor";
}

export interface AICareerAnalysis {
  analysis: string;

  recommendations:
    AICareerRecommendation[];
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

export const generateCareerAnalysis =
  async (
    data: CareerAIInput
  ): Promise<AICareerAnalysis> => {
    const model =
      process.env.OPENAI_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_MODEL is not configured"
      );
    }

    const openai =
      getOpenAIClient();

    const response =
      await openai.responses.create({
        model,

        instructions: `
You are an AI career coach for software developers.

Analyze the candidate's career preparation data.

Important rules:

1. Do not change or recalculate the readiness score.
2. Treat the supplied metrics as authoritative.
3. Explain strengths and weaknesses using the supplied data.
4. Give practical recommendations.
5. Recommendations must connect to modules available in the application.
6. Avoid generic motivational advice.
7. Prefer specific actions such as taking an assessment, completing roadmap topics, improving a resume, or practicing a mock interview.
8. High priority should be used for the biggest weaknesses.
9. Return between 3 and 6 recommendations.
10. Keep the main analysis concise.
`,

        input: `
Target Role:
${data.targetRole}

Career Readiness:
${data.readinessScore}%

Metrics:
Resume: ${data.metrics.resume}%
Interview Preparation: ${data.metrics.interviewPreparation}%
Mock Interview: ${data.metrics.mockInterview}%
Skill Assessment: ${data.metrics.skillAssessment}%
Roadmap: ${data.metrics.roadmap}%

Strong Skills:
${
  data.strongSkills.length
    ? data.strongSkills.join(", ")
    : "No strong skills identified yet"
}

Skills Needing Improvement:
${
  data.weakSkills.length
    ? data.weakSkills.join(", ")
    : "No specific weak skills identified yet"
}

Recent Skill Assessment:
${data.recentAssessmentSummary}

Recent Mock Interview:
${data.recentMockSummary}
`,

        text: {
          format: {
            type:
              "json_schema",

            name:
              "career_monitor_analysis",

            strict: true,

            schema: {
              type: "object",

              properties: {
                analysis: {
                  type: "string",
                },

                recommendations: {
                  type: "array",

                  items: {
                    type:
                      "object",

                    properties: {
                      title: {
                        type:
                          "string",
                      },

                      description:
                        {
                          type:
                            "string",
                        },

                      priority: {
                        type:
                          "string",

                        enum: [
                          "high",
                          "medium",
                          "low",
                        ],
                      },

                      module: {
                        type:
                          "string",

                        enum: [
                          "resume-builder",
                          "interview-preparation",
                          "mock-interview",
                          "roadmap",
                          "skill-assessment",
                          "ai-mentor",
                        ],
                      },
                    },

                    required: [
                      "title",
                      "description",
                      "priority",
                      "module",
                    ],

                    additionalProperties:
                      false,
                  },
                },
              },

              required: [
                "analysis",
                "recommendations",
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
        "AI did not return career analysis"
      );
    }

    return JSON.parse(
      response.output_text
    ) as AICareerAnalysis;
  };