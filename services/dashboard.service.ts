import Resume from "../models/resume.model";
import InterviewProgress from "../models/interviewProgress.model";
import InterviewQuestion from "../models/interview.model";
import SkillAssessment from "../models/skillAssessment.model";
import MockInterview from "../models/mockInterview.model";
import Roadmap from "../models/roadmap.model";

/* =========================================================
   HELPERS
========================================================= */

const clamp = (value: number) =>
  Math.min(
    100,
    Math.max(0, Math.round(value))
  );

const average = (values: number[]) => {
  if (!values.length) {
    return 0;
  }

  return (
    values.reduce(
      (total, value) => total + value,
      0
    ) / values.length
  );
};

/* =========================================================
   DASHBOARD
========================================================= */

export const getDashboardData =
  async (userId: string) => {
    const [
      resumes,
      interviewProgress,
      totalInterviewQuestions,
      assessments,
      mockInterviews,
      roadmaps,
    ] = await Promise.all([
      Resume.find({
        userId,
      })
        .sort({
          updatedAt: -1,
        })
        .limit(5)
        .lean(),

      InterviewProgress.findOne({
        userId,
      }).lean(),

      InterviewQuestion.countDocuments({
        isActive: true,
      }),

      SkillAssessment.find({
        userId,
        status: "completed",
      })
        .sort({
          completedAt: -1,
        })
        .limit(10)
        .lean(),

      MockInterview.find({
        userId,
        status: "completed",
      })
        .sort({
          updatedAt: -1,
        })
        .limit(10)
        .lean(),

      Roadmap.find({
        userId,
      })
        .sort({
          updatedAt: -1,
        })
        .limit(5)
        .lean(),
    ]);

    /* =====================================================
       INTERVIEW
    ===================================================== */

    const completedQuestions =
      interviewProgress
        ?.completedQuestions
        ?.length || 0;

    const bookmarkedQuestions =
      interviewProgress
        ?.bookmarkedQuestions
        ?.length || 0;

    const interviewProgressPercentage =
      totalInterviewQuestions > 0
        ? clamp(
            (completedQuestions /
              totalInterviewQuestions) *
              100
          )
        : 0;

    /* =====================================================
       ASSESSMENTS
    ===================================================== */

    const assessmentAverage =
      assessments.length
        ? clamp(
            average(
              assessments.map(
                (item) =>
                  item.percentage || 0
              )
            )
          )
        : 0;

    const skillPerformance =
      assessments.slice(0, 5).map(
        (item) => ({
          technology:
            item.technology,

          topic:
            item.topic,

          percentage:
            item.percentage,

          skillLevel:
            item.skillLevel,
        })
      );

    /* =====================================================
       MOCK INTERVIEWS
    ===================================================== */

    const getMockScore = (
      mock: any
    ) => {
      if (
        typeof mock.percentage ===
        "number"
      ) {
        return clamp(
          mock.percentage
        );
      }

      const questionScores = (
        mock.questions || []
      )
        .map(
          (question: any) =>
            Number(
              question.score
            )
        )
        .filter(
          (score: number) =>
            Number.isFinite(
              score
            )
        );

      if (!questionScores.length) {
        return 0;
      }

      return clamp(
        average(
          questionScores
        ) * 10
      );
    };

    const mockAverage =
      mockInterviews.length
        ? clamp(
            average(
              mockInterviews.map(
                getMockScore
              )
            )
          )
        : 0;

    /* =====================================================
       ROADMAP
    ===================================================== */

    const activeRoadmap =
      roadmaps[0] || null;

    const roadmapProgress =
      activeRoadmap
        ? clamp(
            Number(
              activeRoadmap.progress
            ) || 0
          )
        : 0;

    /* =====================================================
       CAREER READINESS
    ===================================================== */

    const resumeScore =
      resumes.length > 0
        ? 100
        : 0;

    const readinessScore =
      clamp(
        resumeScore * 0.15 +
          interviewProgressPercentage *
            0.2 +
          mockAverage * 0.25 +
          assessmentAverage * 0.25 +
          roadmapProgress * 0.15
      );

    /* =====================================================
       RECENT RESUMES
    ===================================================== */

    const recentResumes =
      resumes.slice(0, 3).map(
        (resume: any) => ({
          _id:
            resume._id.toString(),

          title:
            resume.title ||
            resume
              .personalDetails
              ?.title ||
            "Untitled Resume",

          updatedAt:
            resume.updatedAt,

          status:
            resume.status ||
            "Draft",
        })
      );

    /* =====================================================
       RECENT ACTIVITY
    ===================================================== */

    const recentActivity: {
      id: string;
      type: string;
      title: string;
      description: string;
      date: Date;
      href: string;
    }[] = [];

    assessments
      .slice(0, 3)
      .forEach(
        (assessment: any) => {
          recentActivity.push({
            id:
              assessment._id.toString(),

            type:
              "assessment",

            title: `${
              assessment.technology
            } Assessment`,

            description: `${
              assessment.percentage
            }% · ${
              assessment.skillLevel
            }`,

            date:
              assessment.completedAt ||
              assessment.updatedAt,

            href:
              "/skill-assessment",
          });
        }
      );

    mockInterviews
      .slice(0, 3)
      .forEach(
        (mock: any) => {
          recentActivity.push({
            id:
              mock._id.toString(),

            type:
              "mock",

            title: `${
              mock.technology ||
              "Technical"
            } Mock Interview`,

            description: `${
              mock.topic ||
              "General"
            } · Completed`,

            date:
              mock.updatedAt,

            href:
              "/mock-interview",
          });
        }
      );

    resumes
      .slice(0, 3)
      .forEach(
        (resume: any) => {
          recentActivity.push({
            id:
              resume._id.toString(),

            type:
              "resume",

            title:
              resume.title ||
              "Resume",

            description:
              "Resume updated",

            date:
              resume.updatedAt,

            href:
              "/resumes",
          });
        }
      );

    recentActivity.sort(
      (a, b) =>
        new Date(
          b.date
        ).getTime() -
        new Date(
          a.date
        ).getTime()
    );

    return {
      stats: {
        resumes:
          await Resume.countDocuments({
            userId,
          }),

        interviewCompleted:
          completedQuestions,

        assessmentsCompleted:
          await SkillAssessment.countDocuments(
            {
              userId,
              status:
                "completed",
            }
          ),

        mockInterviewsCompleted:
          await MockInterview.countDocuments(
            {
              userId,
              status:
                "completed",
            }
          ),
      },

      careerReadiness: {
        score:
          readinessScore,

        interview:
          interviewProgressPercentage,

        assessment:
          assessmentAverage,

        mockInterview:
          mockAverage,

        roadmap:
          roadmapProgress,
      },

      interview: {
        completed:
          completedQuestions,

        total:
          totalInterviewQuestions,

        bookmarked:
          bookmarkedQuestions,

        percentage:
          interviewProgressPercentage,
      },

      roadmap:
        activeRoadmap
          ? {
              _id:
                activeRoadmap._id.toString(),

              targetRole:
                activeRoadmap.targetRole,

              progress:
                roadmapProgress,

              status:
                activeRoadmap.status,
            }
          : null,

      skillPerformance,

      recentResumes,

      recentActivity:
        recentActivity.slice(
          0,
          6
        ),
    };
  };