import {
    Types,
  } from "mongoose";
  
  import CareerMonitor from "../models/careerMonitor.model";
  
  import Resume from "../models/resume.model";
  
  import InterviewProgress from "../models/interviewProgress.model";
  
  import InterviewQuestion from "../models/interview.model";
  
  import MockInterview from "../models/mockInterview.model";
  
  import SkillAssessment from "../models/skillAssessment.model";
  
  import Roadmap from "../models/roadmap.model";
  
  import {
    generateCareerAnalysis,
  } from "./aiCareerMonitor.service";
  
    //  TYPES
  
  export interface CareerMetrics {
    resume: number;
  
    interviewPreparation: number;
  
    mockInterview: number;
  
    skillAssessment: number;
  
    roadmap: number;
  }
  
  export interface CurrentCareerMonitor {
    targetRole: string;
  
    readinessScore: number;
  
    metrics:
      CareerMetrics;
  
    strongSkills: string[];
  
    weakSkills: string[];
  
    recentAssessmentSummary:
      string;
  
    recentMockSummary:
      string;
  }
  
    //  HELPERS
  
  const clamp =
    (
      value: number
    ) =>
      Math.min(
        100,
        Math.max(
          0,
          Math.round(
            value
          )
        )
      );
  
  const average =
    (
      values: number[]
    ) => {
      if (
        values.length === 0
      ) {
        return 0;
      }
  
      return (
        values.reduce(
          (
            total,
            value
          ) =>
            total +
            value,
          0
        ) /
        values.length
      );
    };
  
    //  RESUME SCORE
  
  const calculateResumeScore =
    async (
      userId: string
    ) => {
      const resume =
        await Resume.findOne({
          userId,
        })
          .sort({
            updatedAt: -1,
          })
          .lean();
  
      if (!resume) {
        return 0;
      }
  
      /*
       * Because resume schemas can
       * vary during development,
       * safely inspect the document.
       */
  
      const data =
        resume as any;
  
      let score = 0;
  
      const personal =
        data.personalDetails ||
        data.personal ||
        {};
  
      if (
        personal.fullName ||
        personal.name
      ) {
        score += 10;
      }
  
      if (personal.email) {
        score += 10;
      }
  
      if (
        personal.phone
      ) {
        score += 5;
      }
  
      if (
        data.title ||
        personal.title
      ) {
        score += 10;
      }
  
      if (
        data.summary &&
        String(
          data.summary
        ).trim()
      ) {
        score += 15;
      }
  
      if (
        Array.isArray(
          data.skills
        ) &&
        data.skills.length >=
          3
      ) {
        score += 15;
      }
  
      if (
        Array.isArray(
          data.experience
        ) &&
        data.experience.length >
          0
      ) {
        score += 15;
      }
  
      if (
        Array.isArray(
          data.education
        ) &&
        data.education.length >
          0
      ) {
        score += 10;
      }
  
      if (
        Array.isArray(
          data.projects
        ) &&
        data.projects.length >
          0
      ) {
        score += 10;
      }
  
      return clamp(
        score
      );
    };
  
    //  INTERVIEW PREPARATION
  
  const calculateInterviewPreparation =
    async (
      userId: string
    ) => {
      const progress =
        await InterviewProgress.findOne(
          {
            userId,
          }
        ).lean();
  
      if (!progress) {
        return 0;
      }
  
      const totalQuestions =
        await InterviewQuestion.countDocuments(
          {
            isActive: true,
          }
        );
  
      if (
        totalQuestions ===
        0
      ) {
        return 0;
      }
  
      const completed =
        progress.completedQuestions
          ?.length || 0;
  
      return clamp(
        (completed /
          totalQuestions) *
          100
      );
    };
  
    //  MOCK INTERVIEW SCORE
  
  const calculateMockInterviewScore =
    async (
      userId: string
    ) => {
      const interviews =
        await MockInterview.find(
          {
            userId,
  
            status:
              "completed",
          }
        )
          .sort({
            updatedAt: -1,
          })
          .limit(5)
          .lean();
  
      if (
        interviews.length ===
        0
      ) {
        return 0;
      }
  
      const percentages =
        interviews.map(
          (interview: any) => {
            /*
             * If you have an overall
             * score use it first.
             */
  
            if (
              typeof interview.percentage ===
              "number"
            ) {
              return clamp(
                interview.percentage
              );
            }
  
            if (
              typeof interview.score ===
              "number"
            ) {
              /*
               * Your mock questions
               * commonly use score values.
               * If score is already
               * percentage-like this works.
               */
  
              if (
                interview.score <=
                10
              ) {
                return clamp(
                  interview.score *
                    10
                );
              }
  
              return clamp(
                interview.score
              );
            }
  
            const questions =
              interview.questions ||
              [];
  
            const scores =
              questions
                .map(
                  (
                    question: any
                  ) =>
                    Number(
                      question.score
                    )
                )
                .filter(
                  (
                    score: number
                  ) =>
                    Number.isFinite(
                      score
                    )
                );
  
            if (
              scores.length ===
              0
            ) {
              return 0;
            }
  
            /*
             * Mock evaluation scores
             * are assumed 0-10 here.
             */
  
            return clamp(
              average(
                scores
              ) * 10
            );
          }
        );
  
      return clamp(
        average(
          percentages
        )
      );
    };
  
    //  SKILL ASSESSMENT
  
  const calculateSkillAssessmentScore =
    async (
      userId: string
    ) => {
      const assessments =
        await SkillAssessment.find(
          {
            userId,
  
            status:
              "completed",
          }
        )
          .sort({
            completedAt: -1,
          })
          .limit(5)
          .select(
            "percentage"
          )
          .lean();
  
      if (
        assessments.length ===
        0
      ) {
        return 0;
      }
  
      return clamp(
        average(
          assessments.map(
            (assessment) =>
              assessment.percentage
          )
        )
      );
    };
  
    //  ROADMAP
  
  const calculateRoadmapScore =
    async (
      userId: string
    ) => {
      const roadmaps =
        await Roadmap.find({
          userId,
        })
          .sort({
            updatedAt: -1,
          })
          .limit(3)
          .select(
            "progress"
          )
          .lean();
  
      if (
        roadmaps.length ===
        0
      ) {
        return 0;
      }
  
      return clamp(
        average(
          roadmaps.map(
            (roadmap) =>
              roadmap.progress
          )
        )
      );
    };
  
    //  SKILL ANALYSIS
  
  const getSkillAnalysis =
    async (
      userId: string
    ) => {
      const assessments =
        await SkillAssessment.find(
          {
            userId,
  
            status:
              "completed",
          }
        )
          .sort({
            completedAt: -1,
          })
          .limit(10)
          .lean();
  
      const skillMap =
        new Map<
          string,
          number[]
        >();
  
      for (
        const assessment of assessments
      ) {
        const skill =
          assessment.technology;
  
        if (!skill) {
          continue;
        }
  
        const scores =
          skillMap.get(
            skill
          ) || [];
  
        scores.push(
          assessment.percentage
        );
  
        skillMap.set(
          skill,
          scores
        );
      }
  
      const results =
        Array.from(
          skillMap.entries()
        ).map(
          ([
            skill,
            scores,
          ]) => ({
            skill,
  
            score:
              average(
                scores
              ),
          })
        );
  
      const strongSkills =
        results
          .filter(
            (item) =>
              item.score >=
              75
          )
          .sort(
            (a, b) =>
              b.score -
              a.score
          )
          .map(
            (item) =>
              item.skill
          )
          .slice(
            0,
            5
          );
  
      const weakSkills =
        results
          .filter(
            (item) =>
              item.score <
              60
          )
          .sort(
            (a, b) =>
              a.score -
              b.score
          )
          .map(
            (item) =>
              item.skill
          )
          .slice(
            0,
            5
          );
  
      return {
        strongSkills,
        weakSkills,
      };
    };
  
    //  TARGET ROLE
  
  const getTargetRole =
    async (
      userId: string
    ) => {
      const roadmap =
        await Roadmap.findOne({
          userId,
        })
          .sort({
            updatedAt: -1,
          })
          .select(
            "targetRole"
          )
          .lean();
  
      if (
        roadmap?.targetRole
      ) {
        return roadmap.targetRole;
      }
  
      const resume =
        await Resume.findOne({
          userId,
        })
          .sort({
            updatedAt: -1,
          })
          .lean();
  
      const resumeData =
        resume as any;
  
      return (
        resumeData?.title ||
        resumeData
          ?.personalDetails
          ?.title ||
        "Software Developer"
      );
    };
  
    //  RECENT SUMMARIES
  
  const getRecentAssessmentSummary =
    async (
      userId: string
    ) => {
      const assessment =
        await SkillAssessment.findOne(
          {
            userId,
  
            status:
              "completed",
          }
        )
          .sort({
            completedAt: -1,
          })
          .lean();
  
      if (!assessment) {
        return "No completed skill assessment yet.";
      }
  
      return `${assessment.technology}: ${assessment.percentage}% (${assessment.skillLevel}). Strong areas: ${
        assessment.strongAreas?.join(
          ", "
        ) || "none identified"
      }. Improvement areas: ${
        assessment.improvementAreas?.join(
          ", "
        ) || "none identified"
      }.`;
    };
  
  const getRecentMockSummary =
    async (
      userId: string
    ) => {
      const mock =
        await MockInterview.findOne(
          {
            userId,
  
            status:
              "completed",
          }
        )
          .sort({
            updatedAt: -1,
          })
          .lean();
  
      if (!mock) {
        return "No completed mock interview yet.";
      }
  
      const data =
        mock as any;
  
      const questionScores =
        (
          data.questions ||
          []
        )
          .map(
            (
              question: any
            ) =>
              Number(
                question.score
              )
          )
          .filter(
            (
              score: number
            ) =>
              Number.isFinite(
                score
              )
          );
  
      const avg =
        questionScores.length
          ? average(
              questionScores
            )
          : 0;
  
      return `${data.technology || "Technical"} mock interview. Average question score: ${avg.toFixed(
        1
      )}/10.`;
    };
  
    //  CURRENT METRICS
  
  export const getCurrentCareerMetrics =
    async (
      userId: string
    ): Promise<CurrentCareerMonitor> => {
      if (
        !Types.ObjectId.isValid(
          userId
        )
      ) {
        throw new Error(
          "Invalid user ID"
        );
      }
  
      const [
        resume,
        interviewPreparation,
        mockInterview,
        skillAssessment,
        roadmap,
        skillAnalysis,
        targetRole,
        recentAssessmentSummary,
        recentMockSummary,
      ] =
        await Promise.all([
          calculateResumeScore(
            userId
          ),
  
          calculateInterviewPreparation(
            userId
          ),
  
          calculateMockInterviewScore(
            userId
          ),
  
          calculateSkillAssessmentScore(
            userId
          ),
  
          calculateRoadmapScore(
            userId
          ),
  
          getSkillAnalysis(
            userId
          ),
  
          getTargetRole(
            userId
          ),
  
          getRecentAssessmentSummary(
            userId
          ),
  
          getRecentMockSummary(
            userId
          ),
        ]);
  
      const metrics:
        CareerMetrics = {
        resume,
  
        interviewPreparation,
  
        mockInterview,
  
        skillAssessment,
  
        roadmap,
      };
  
      /*
       * Weighted readiness:
       *
       * Resume             15%
       * Interview Prep     20%
       * Mock Interview     25%
       * Skill Assessment   25%
       * Roadmap            15%
       */
  
      const readinessScore =
        clamp(
          resume * 0.15 +
            interviewPreparation *
              0.2 +
            mockInterview *
              0.25 +
            skillAssessment *
              0.25 +
            roadmap *
              0.15
        );
  
      return {
        targetRole,
  
        readinessScore,
  
        metrics,
  
        strongSkills:
          skillAnalysis.strongSkills,
  
        weakSkills:
          skillAnalysis.weakSkills,
  
        recentAssessmentSummary,
  
        recentMockSummary,
      };
    };
  
    //  AI ANALYSIS + SAVE SNAPSHOT
  
  export const analyzeCareer =
    async (
      userId: string
    ) => {
      const current =
        await getCurrentCareerMetrics(
          userId
        );
  
      let aiAnalysis =
        "";
  
      let recommendations:
        {
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
        }[] = [];
  
      try {
        const ai =
          await generateCareerAnalysis(
            {
              ...current,
            }
          );
  
        aiAnalysis =
          ai.analysis;
  
        recommendations =
          ai.recommendations;
      } catch (error) {
        console.error(
          "AI career analysis failed:",
          error
        );
  
        /*
         * Metrics should still work
         * even if OpenAI fails.
         */
  
        aiAnalysis =
          "Your career metrics were calculated successfully, but AI recommendations are temporarily unavailable.";
  
        recommendations =
          createFallbackRecommendations(
            current.metrics
          );
      }
  
      const snapshot =
        await CareerMonitor.create(
          {
            userId:
              new Types.ObjectId(
                userId
              ),
  
            targetRole:
              current.targetRole,
  
            readinessScore:
              current.readinessScore,
  
            metrics:
              current.metrics,
  
            strongSkills:
              current.strongSkills,
  
            weakSkills:
              current.weakSkills,
  
            aiAnalysis,
  
            recommendations,
  
            generatedAt:
              new Date(),
          }
        );
  
      return snapshot;
    };
  
    //  FALLBACK RECOMMENDATIONS
  
  const createFallbackRecommendations =
    (
      metrics: CareerMetrics
    ) => {
      const items = [
        {
          score:
            metrics.resume,
  
          title:
            "Improve your resume",
  
          description:
            "Complete and strengthen your resume with skills, projects and professional experience.",
  
          priority:
            "medium" as const,
  
          module:
            "resume-builder" as const,
        },
  
        {
          score:
            metrics.interviewPreparation,
  
          title:
            "Practice interview questions",
  
          description:
            "Complete more technical interview preparation questions.",
  
          priority:
            "medium" as const,
  
          module:
            "interview-preparation" as const,
        },
  
        {
          score:
            metrics.mockInterview,
  
          title:
            "Take a mock interview",
  
          description:
            "Practice answering technical questions under interview conditions.",
  
          priority:
            "high" as const,
  
          module:
            "mock-interview" as const,
        },
  
        {
          score:
            metrics.skillAssessment,
  
          title:
            "Test your technical skills",
  
          description:
            "Take another skill assessment and focus on your lowest-scoring technology.",
  
          priority:
            "high" as const,
  
          module:
            "skill-assessment" as const,
        },
  
        {
          score:
            metrics.roadmap,
  
          title:
            "Continue your roadmap",
  
          description:
            "Complete pending topics from your active learning roadmap.",
  
          priority:
            "medium" as const,
  
          module:
            "roadmap" as const,
        },
      ];
  
      return items
        .sort(
          (a, b) =>
            a.score -
            b.score
        )
        .slice(
          0,
          4
        )
        .map(
          ({
            score,
            ...item
          }) => item
        );
    };
  
    //  HISTORY
  
  export const getCareerHistory =
    async (
      userId: string
    ) => {
      return CareerMonitor.find({
        userId,
      })
        .sort({
          generatedAt: -1,
        })
        .limit(30);
    };
  
    //  HISTORY ITEM
  
  export const getCareerSnapshot =
    async (
      id: string,
      userId: string
    ) => {
      if (
        !Types.ObjectId.isValid(
          id
        )
      ) {
        throw new Error(
          "Invalid analysis ID"
        );
      }
  
      const snapshot =
        await CareerMonitor.findOne(
          {
            _id: id,
            userId,
          }
        );
  
      if (!snapshot) {
        throw new Error(
          "Career analysis not found"
        );
      }
  
      return snapshot;
    };
  
    //  DELETE
  
  export const deleteCareerSnapshot =
    async (
      id: string,
      userId: string
    ) => {
      if (
        !Types.ObjectId.isValid(
          id
        )
      ) {
        throw new Error(
          "Invalid analysis ID"
        );
      }
  
      const snapshot =
        await CareerMonitor.findOneAndDelete(
          {
            _id: id,
            userId,
          }
        );
  
      if (!snapshot) {
        throw new Error(
          "Career analysis not found"
        );
      }
  
      return snapshot;
    };