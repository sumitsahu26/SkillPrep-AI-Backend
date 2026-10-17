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

/* =========================================================
   TYPES
========================================================= */

export interface GenerateRoadmapInput {
  targetRole: string;

  experience: string;

  durationWeeks: number;

  currentSkills: string[];

  targetSkills?: string[];
}

export interface AIRoadmapResource {
  title: string;

  type:
    | "documentation"
    | "practice"
    | "project"
    | "video"
    | "other";

  url: string;
}

export interface AIRoadmapTopic {
  title: string;

  description: string;
}

export interface AIRoadmapStep {
  week: number;

  title: string;

  description: string;

  topics: AIRoadmapTopic[];

  resources: AIRoadmapResource[];
}

export interface AIRoadmapResult {
  title: string;

  targetSkills: string[];

  steps: AIRoadmapStep[];
}

/* =========================================================
   GENERATE
========================================================= */

export const generateAIRoadmap =
  async (
    data: GenerateRoadmapInput
  ): Promise<AIRoadmapResult> => {
    const {
      targetRole,
      experience,
      durationWeeks,
      currentSkills,
      targetSkills = [],
    } = data;

    const model =
      process.env.OPENAI_MODEL;

    if (!model) {
      throw new Error(
        "OPENAI_MODEL is not configured"
      );
    }

    const response =
      await openai.responses.create({
        model,

        instructions: `
You are an expert software engineering career mentor.

Create a practical learning roadmap for a software developer.

Rules:

1. The roadmap must match the candidate's target role.
2. Consider their existing skills so you do not waste weeks on basics they already know.
3. Consider their professional experience level.
4. Create exactly the requested number of weeks.
5. Each week must have a clear objective.
6. Each week should contain 3 to 6 focused topics.
7. Prefer practical learning over theoretical learning.
8. Include interview preparation where appropriate.
9. Include projects/practice where appropriate.
10. Do not invent URLs.
11. Resource URL may be an empty string when no verified URL is available.
12. Keep descriptions concise.
13. Target skills should contain important skills needed for the target role.
14. Avoid duplicate topics across weeks.
15. Later weeks should build upon earlier weeks.
`,

        input: `
Target Role:
${targetRole}

Professional Experience:
${experience}

Roadmap Duration:
${durationWeeks} weeks

Current Skills:
${
  currentSkills.length
    ? currentSkills.join(", ")
    : "Not provided"
}

Requested Target Skills:
${
  targetSkills.length
    ? targetSkills.join(", ")
    : "Determine them based on the target role"
}

Generate the learning roadmap.
`,

        text: {
          format: {
            type: "json_schema",

            name:
              "developer_learning_roadmap",

            strict: true,

            schema: {
              type: "object",

              properties: {
                title: {
                  type: "string",
                },

                targetSkills: {
                  type: "array",

                  items: {
                    type: "string",
                  },
                },

                steps: {
                  type: "array",

                  items: {
                    type: "object",

                    properties: {
                      week: {
                        type: "number",
                      },

                      title: {
                        type: "string",
                      },

                      description: {
                        type: "string",
                      },

                      topics: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            title: {
                              type: "string",
                            },

                            description: {
                              type: "string",
                            },
                          },

                          required: [
                            "title",
                            "description",
                          ],

                          additionalProperties:
                            false,
                        },
                      },

                      resources: {
                        type: "array",

                        items: {
                          type: "object",

                          properties: {
                            title: {
                              type: "string",
                            },

                            type: {
                              type: "string",

                              enum: [
                                "documentation",
                                "practice",
                                "project",
                                "video",
                                "other",
                              ],
                            },

                            url: {
                              type: "string",
                            },
                          },

                          required: [
                            "title",
                            "type",
                            "url",
                          ],

                          additionalProperties:
                            false,
                        },
                      },
                    },

                    required: [
                      "week",
                      "title",
                      "description",
                      "topics",
                      "resources",
                    ],

                    additionalProperties:
                      false,
                  },
                },
              },

              required: [
                "title",
                "targetSkills",
                "steps",
              ],

              additionalProperties:
                false,
            },
          },
        },
      });

    if (!response.output_text) {
      throw new Error(
        "AI did not generate a roadmap"
      );
    }

    const result =
      JSON.parse(
        response.output_text
      ) as AIRoadmapResult;

    if (
      !result.steps ||
      !Array.isArray(
        result.steps
      )
    ) {
      throw new Error(
        "Invalid roadmap generated by AI"
      );
    }

    /*
     * Protect against AI returning
     * more weeks than requested.
     */

    result.steps =
      result.steps
        .slice(
          0,
          durationWeeks
        )
        .map(
          (step, index) => ({
            ...step,

            week:
              index + 1,
          })
        );

    return result;
  };