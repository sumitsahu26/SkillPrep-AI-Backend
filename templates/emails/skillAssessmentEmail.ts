export interface SkillAssessmentEmailData {
    userName: string;
    assessmentName: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    skillLevel: string;
  }
  
  export const getSkillAssessmentEmailTemplate = ({
    userName,
    assessmentName,
    score,
    totalQuestions,
    correctAnswers,
    skillLevel,
  }: SkillAssessmentEmailData) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
  
        <h2 style="color: #18181b;">
          Your Skill Assessment Results
        </h2>
  
        <p>Hello ${userName},</p>
  
        <p>
          Your skill assessment
          <strong>${assessmentName}</strong>
          has been completed.
        </p>
  
        <div
          style="
            margin: 25px 0;
            padding: 20px;
            background: #f4f4f5;
            border-radius: 12px;
          "
        >
          <p style="margin: 8px 0;">
            <strong>Assessment:</strong> ${assessmentName}
          </p>
  
          <p style="margin: 8px 0;">
            <strong>Score:</strong> ${score}%
          </p>
  
          <p style="margin: 8px 0;">
            <strong>Correct Answers:</strong>
            ${correctAnswers} / ${totalQuestions}
          </p>
  
          <p style="margin: 8px 0;">
            <strong>Skill Level:</strong> ${skillLevel}
          </p>
        </div>
  
        <p>
          Use these results to identify areas for improvement and continue
          developing your technical skills.
        </p>
  
        <div style="margin: 30px 0;">
          <a
            href="${process.env.FRONTEND_URL}/skill-assessment"
            style="
              display: inline-block;
              padding: 12px 20px;
              background: #7c3aed;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
            "
          >
            View Assessment
          </a>
        </div>
  
        <p style="margin-top: 30px;">
          Keep learning and improving!<br />
          <strong>SkillPrep AI</strong>
        </p>
  
      </div>
    `;
  };