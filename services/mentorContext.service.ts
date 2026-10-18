import Resume from "../models/resume.model";

import InterviewProgress from "../models/interviewProgress.model";

import InterviewQuestion from "../models/interview.model";

import SkillAssessment from "../models/skillAssessment.model";

import MockInterview from "../models/mockInterview.model";

import Roadmap from "../models/roadmap.model";

/* =========================================================
   TYPE
========================================================= */

export interface MentorContext {
  targetRole: string;

  resumeSummary: string;

  interviewProgress: string;

  skillAssessmentSummary: string;

  mockInterviewSummary: string;

  roadmapSummary: string;
}

/* =========================================================
   CONTEXT
========================================================= */

export const getMentorContext =
  async (
    userId: string
  ): Promise<MentorContext> => {
    const [
      resume,
      interviewProgress,
      totalInterviewQuestions,
      assessments,
      mockInterviews,
      roadmap,
    ] =
      await Promise.all([
        Resume.findOne({
          userId,
        })
          .sort({
            updatedAt: -1,
          })
          .lean(),

        InterviewProgress.findOne(
          {
            userId,
          }
        ).lean(),

        InterviewQuestion.countDocuments(
          {
            isActive: true,
          }
        ),

        SkillAssessment.find(
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
          .lean(),

        MockInterview.find(
          {
            userId,

            status:
              "completed",
          }
        )
          .sort({
            updatedAt: -1,
          })
          .limit(3)
          .lean(),

        Roadmap.findOne({
          userId,
        })
          .sort({
            updatedAt: -1,
          })
          .lean(),
      ]);

    /* =====================================================
       RESUME
    ===================================================== */

    const resumeData =
      resume as any;

    const skills =
      Array.isArray(
        resumeData?.skills
      )
        ? resumeData.skills
            .map(
              (
                skill: any
              ) =>
                typeof skill ===
                "string"
                  ? skill
                  : skill?.name
            )
            .filter(Boolean)
        : [];

    const experiences =
      Array.isArray(
        resumeData?.experience
      )
        ? resumeData.experience
        : [];

    const projects =
      Array.isArray(
        resumeData?.projects
      )
        ? resumeData.projects
        : [];

    const resumeTitle =
      resumeData?.title ||
      resumeData
        ?.personalDetails
        ?.title ||
      resumeData
        ?.personal
        ?.title ||
      "";

    const resumeSummary =
      resume
        ? `
Resume title: ${
            resumeTitle ||
            "Not provided"
          }

Skills: ${
            skills.length
              ? skills.join(
                  ", "
                )
              : "No skills listed"
          }

Experience entries: ${
            experiences.length
          }

Projects: ${
            projects.length
          }
`
        : "No resume has been created yet.";

    /* =====================================================
       INTERVIEW PREPARATION
    ===================================================== */

    const completedQuestions =
      interviewProgress
        ?.completedQuestions
        ?.length || 0;

    const bookmarkedQuestions =
      interviewProgress
        ?.bookmarkedQuestions
        ?.length || 0;

    const interviewPercentage =
      totalInterviewQuestions >
      0
        ? Math.round(
            (completedQuestions /
              totalInterviewQuestions) *
              100
          )
        : 0;

    const interviewSummary = `
Completed interview questions: ${completedQuestions}
Available interview questions: ${totalInterviewQuestions}
Interview preparation progress: ${interviewPercentage}%
Bookmarked questions: ${bookmarkedQuestions}
`;

    /* =====================================================
       ASSESSMENTS
    ===================================================== */

    const assessmentSummary =
      assessments.length
        ? assessments
            .map(
              (
                assessment
              ) => {
                return `${assessment.technology} / ${assessment.topic}: ${assessment.percentage}% (${assessment.skillLevel}). Strong areas: ${
                  assessment
                    .strongAreas
                    ?.join(
                      ", "
                    ) ||
                  "none"
                }. Improvement areas: ${
                  assessment
                    .improvementAreas
                    ?.join(
                      ", "
                    ) ||
                  "none"
                }.`;
              }
            )
            .join("\n")
        : "No completed skill assessments.";

    /* =====================================================
       MOCK INTERVIEWS
    ===================================================== */

    const mockSummary =
      mockInterviews.length
        ? mockInterviews
            .map(
              (
                mock: any
              ) => {
                const questions =
                  mock.questions ||
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

                const average =
                  scores.length
                    ? (
                        scores.reduce(
                          (
                            total: number,
                            score: number
                          ) =>
                            total +
                            score,
                          0
                        ) /
                        scores.length
                      ).toFixed(
                        1
                      )
                    : "N/A";

                return `${
                  mock.technology ||
                  "Technical"
                } / ${
                  mock.topic ||
                  "General"
                }: average ${average}/10`;
              }
            )
            .join("\n")
        : "No completed mock interviews.";

    /* =====================================================
       ROADMAP
    ===================================================== */

    const roadmapSummary =
      roadmap
        ? `
Target role: ${
            roadmap.targetRole
          }
Experience: ${
            roadmap.experience
          }
Roadmap progress: ${
            roadmap.progress
          }%
Status: ${
            roadmap.status
          }
Current skills: ${
            roadmap.currentSkills
              ?.join(
                ", "
              ) ||
            "Not specified"
          }
Target skills: ${
            roadmap.targetSkills
              ?.join(
                ", "
              ) ||
            "Not specified"
          }
`
        : "No learning roadmap created yet.";

    /* =====================================================
       TARGET ROLE
    ===================================================== */

    const targetRole =
      roadmap?.targetRole ||
      resumeTitle ||
      "Software Developer";

    return {
      targetRole,

      resumeSummary,

      interviewProgress:
        interviewSummary,

      skillAssessmentSummary:
        assessmentSummary,

      mockInterviewSummary:
        mockSummary,

      roadmapSummary,
    };
  };