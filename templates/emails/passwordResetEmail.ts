export const getPasswordResetEmailTemplate = (
    userName: string,
    resetUrl: string
  ) => {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
  
        <h2 style="color: #18181b;">
          Reset your password
        </h2>
  
        <p>Hello ${userName},</p>
  
        <p>
          We received a request to reset your SkillPrep AI password.
        </p>
  
        <p>
          Click the button below to create a new password.
        </p>
  
        <div style="margin: 30px 0;">
          <a
            href="${resetUrl}"
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
            Reset Password
          </a>
        </div>
  
        <p style="color: #52525b;">
          This link expires in 15 minutes.
        </p>
  
        <p style="color: #71717a;">
          If you did not request a password reset, you can safely ignore this email.
        </p>
  
        <p style="margin-top: 30px;">
          Regards,<br />
          <strong>SkillPrep AI</strong>
        </p>
  
      </div>
    `;
  };