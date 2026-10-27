export const getWelcomeEmailTemplate = (userName: string) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
  
        <h2 style="color: #18181b;">
          Welcome to SkillPrep AI 🎉
        </h2>
  
        <p>Hello ${userName},</p>
  
        <p>
          Welcome to SkillPrep AI! We're excited to have you with us.
        </p>
  
        <p>
          SkillPrep AI helps you prepare for interviews, build better resumes,
          improve your skills, and plan your career.
        </p>
  
        <div style="margin: 30px 0;">
          <a
            href="${process.env.FRONTEND_URL}/dashboard"
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
            Go to Dashboard
          </a>
        </div>
  
        <p style="color: #52525b;">
          Start by creating your resume and preparing for your next interview.
        </p>
  
        <p style="margin-top: 30px;">
          Regards,<br />
          <strong>SkillPrep AI</strong>
        </p>
  
      </div>
    `;
  };