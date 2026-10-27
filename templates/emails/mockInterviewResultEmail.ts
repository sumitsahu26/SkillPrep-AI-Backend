export interface MockInterviewResultEmailData {
    userName: string;
    technology: string;
    score: number;
    totalQuestions: number;
    correctAnswers: number;
  }
  
  export const getMockInterviewResultEmailTemplate = ({
    userName,
    technology,
    score,
    totalQuestions,
    correctAnswers,
  }: MockInterviewResultEmailData) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
  
        <h2 style="color: #18181b;">
          Your Mock Interview Results
        </h2>
  
        <p>Hello ${userName},</p>
  
        <p>
          Your mock interview for <strong>${technology}</strong> has been completed.
          Here are your results:
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
            <strong>Technology:</strong> ${technology}
          </p>
  
          <p style="margin: 8px 0;">
            <strong>Score:</strong> ${score}%
          </p>
  
          <p style="margin: 8px 0;">
            <strong>Correct Answers:</strong>
            ${correctAnswers} / ${totalQuestions}
          </p>
        </div>
  
        <p>
          Review your performance and continue practicing to improve your
          interview skills.
        </p>
  
        <div style="margin: 30px 0;">
          <a
            href="${process.env.FRONTEND_URL}/mock-interview"
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
            View Mock Interviews
          </a>
        </div>
  
        <p style="margin-top: 30px;">
          Keep practicing!<br />
          <strong>SkillPrep AI</strong>
        </p>
  
      </div>
    `;
  };