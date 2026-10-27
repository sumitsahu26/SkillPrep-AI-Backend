import { mailTransporter } from "../config/mail";

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({
  to,
  subject,
  html,
}: SendEmailInput) => {
  await mailTransporter.sendMail({
    from: `"SkillPrep AI" <${process.env.SMTP_FROM}>`,
    to,
    subject,
    html,
  });
};