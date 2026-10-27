export const getPasswordChangedEmailTemplate = (
    userName: string
  ) => {
    return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Password changed successfully</h2>

          <p>Hello ${userName},</p>

          <p>
            Your SkillPrep AI password has been changed successfully.
          </p>

          <p>
            You can now login using your new password.
          </p>

          <p>
            If you did not make this change,
            please contact support immediately.
          </p>

          <p>SkillPrep AI</p>
        </div>
    `;
  };