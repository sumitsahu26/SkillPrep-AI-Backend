import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { OAuth2Client } from "google-auth-library";
import fs from "fs";
import path from "path";
import { createNotification } from "./notification.service";
import { sendEmail } from "./email.service";
import { getPasswordResetEmailTemplate } from "../templates/emails/passwordResetEmail";
import { getPasswordChangedEmailTemplate } from "../templates/emails/passwordChangedEmail";
import { getWelcomeEmailTemplate } from "../templates/emails/welcomeEmail";

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface LoginData {
  email: string;
  password: string;
}

const generateAccessToken = (
  userId: string,
  isAdmin: boolean
): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not defined");
  }

  return jwt.sign(
    {
      userId,
      isAdmin,
    },
    secret,
    {
      expiresIn: "15m",
    }
  );
};

const generateRefreshToken = (
  userId: string
): string => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  return jwt.sign(
    {
      userId,
    },
    secret,
    {
      expiresIn: "7d",
    }
  );
};

export const registerUser = async (
  data: RegisterData
) => {
  const name = data.name.trim();
  const email = data.email.toLowerCase().trim();
  const password = data.password;

  const existingUser = await User.findOne({
    email,
  });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(
    password,
    10
  );

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    authProvider: "local",
  });

  if (user) {
    await createNotification({
      userId: user._id.toString(),
      title: "Welcome to SkillPrep AI",
      description:
        "Start building your resume and preparing for your next interview.",
      type: "system",
      link: "/dashboard",
    });

    await sendEmail({
      to: user.email,
      subject: "Welcome to SkillPrep AI",
      html: getWelcomeEmailTemplate(user.name),
    });
  }

  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
  };
};

export const loginUser = async (
  data: LoginData
) => {
  const { email, password } = data;

  const user = await User.findOne({
    email: email.toLowerCase().trim(),
  });

  if (!user) {
    throw new Error("Invalid email or password");
  }

  if (user.isDeleted) {
    throw new Error("This account has been deleted.");
  }

  // Google-only account doesn't have a password
  if (!user.password) {
    throw new Error(
      "This account uses Google login. Please continue with Google."
    );
  }

  const isPasswordMatch = await bcrypt.compare(
    password,
    user.password
  );

  if (!isPasswordMatch) {
    throw new Error("Invalid email or password");
  }


  const accessToken = generateAccessToken(
    user._id.toString(),
    user.isAdmin
  );

  const refreshToken = generateRefreshToken(
    user._id.toString()
  );

  // Hash refresh token before storing
  const hashedRefreshToken = await bcrypt.hash(
    refreshToken,
    10
  );

  user.refreshToken = hashedRefreshToken;

  await user.save();

  return {
    accessToken,
    refreshToken,

    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin,
    },
  };
};

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID
);

//  GOOGLE LOGIN


export const googleLoginUser = async (
  credential: string
) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  // VERIFY GOOGLE ID TOKEN

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  if (!payload) {
    throw new Error("Invalid Google token");
  }

  const {
    sub: googleId,
    email,
    name,
    picture,
    email_verified,
  } = payload;

  if (!email) {
    throw new Error("Google account email not found");
  }

  if (!email_verified) {
    throw new Error("Google email is not verified");
  }

  const normalizedEmail =
    email.toLowerCase().trim();

  // FIND EXISTING USER

  let user = await User.findOne({
    email: normalizedEmail,
  });

  if (user?.isDeleted) {
    throw new Error(
      "This account has been deleted."
    );
  }

  // CREATE GOOGLE USER

  if (!user) {
    user = await User.create({
      name:
        name ||
        normalizedEmail.split("@")[0],

      email: normalizedEmail,

      password: undefined,

      googleId,

      profileImage: "",

      isAdmin: false,

      authProvider: "google",
    });

    // =====================================================
    // DOWNLOAD GOOGLE PROFILE IMAGE
    // =====================================================

    if (picture) {
      try {
        const fileName =
          await downloadGoogleProfileImage(
            picture
          );

        user.profileImage = fileName;

        await user.save();
      } catch (error) {
        console.error(
          "Failed to download Google profile image:",
          error
        );
      }
    }
  } else {
    // =====================================================
    // LINK GOOGLE TO EXISTING ACCOUNT
    // =====================================================

    if (!user.googleId) {
      user.googleId = googleId;
    }

    // =====================================================
    // DOWNLOAD IMAGE ONLY IF PROFILE IMAGE IS EMPTY
    // =====================================================

    if (!user.profileImage && picture) {
      try {
        const fileName =
          await downloadGoogleProfileImage(
            picture
          );

        user.profileImage = fileName;
      } catch (error) {
        console.error(
          "Failed to download Google profile image:",
          error
        );
      }
    }

    user.authProvider = "google";

    await user.save();
  }

  // GENERATE APPLICATION JWT

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.isAdmin
  );

  const refreshToken = generateRefreshToken(
    user._id.toString()
  );

  // HASH REFRESH TOKEN

  const hashedRefreshToken =
    await bcrypt.hash(
      refreshToken,
      10
    );

  user.refreshToken = hashedRefreshToken;

  await user.save();

  // RETURN SAME RESPONSE STRUCTURE AS NORMAL LOGIN

  return {
    accessToken,
    refreshToken,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      profileImage: user.profileImage,
      isAdmin: user.isAdmin,
    },
  };
};

const downloadGoogleProfileImage = async (
  imageUrl: string
): Promise<string> => {
  const uploadPath = path.join(
    process.cwd(),
    "uploads",
    "profile"
  );

  // Make sure uploads/profile exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, {
      recursive: true,
    });
  }

  const fileName =
    Date.now() +
    "-" +
    Math.round(Math.random() * 1e9) +
    ".jpg";

  const filePath = path.join(
    uploadPath,
    fileName
  );

  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new Error(
      `Failed to download Google profile image: ${response.status}`
    );
  }

  const buffer = Buffer.from(
    await response.arrayBuffer()
  );

  await fs.promises.writeFile(
    filePath,
    buffer
  );

  return fileName;
};

export const refreshAccessToken = async (
  refreshToken: string
) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  let decoded: { userId: string };

  try {
    decoded = jwt.verify(
      refreshToken,
      secret
    ) as { userId: string };
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const user = await User.findById(decoded.userId);

  if (!user || !user.refreshToken) {
    throw new Error("Invalid refresh token");
  }

  // Compare incoming token with hashed token
  const isValid = await bcrypt.compare(
    refreshToken,
    user.refreshToken
  );

  if (!isValid) {
    throw new Error("Invalid refresh token");
  }

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.isAdmin
  );

  return accessToken;
};

export const logoutUser = async (
  refreshToken: string
) => {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not defined");
  }

  let decoded: { userId: string };

  try {
    decoded = jwt.verify(
      refreshToken,
      secret
    ) as { userId: string };
  } catch {
    return;
  }

  await User.findByIdAndUpdate(
    decoded.userId,
    {
      $unset: {
        refreshToken: 1,
      },
    }
  );
};

export const getUserProfile = async (
  userId: string
) => {
  const user = await User.findById(userId)
    .select("-password -refreshToken");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

export const forgotPasswordUser = async (email: string) => {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({
    email: normalizedEmail,
    isDeleted: { $ne: true },
  });

  // Do not reveal whether an email exists.
  if (!user) {
    return;
  }
  
  if (!user.password) {
    return;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.resetPasswordToken = hashedToken;

  user.resetPasswordExpires = new Date(
    Date.now() + 15 * 60 * 1000
  );

  await user.save();

  const frontendUrl =
    process.env.FRONTEND_URL || "http://localhost:3000";

  const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your SkillPrep AI password",
      html: getPasswordResetEmailTemplate(user.name, resetUrl),
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    throw new Error("Failed to send reset password email");
  }
};

export const resetPasswordUser = async (
  token: string,
  newPassword: string
) => {
  if (!token) {
    throw new Error("Reset token is required");
  }

  if (!newPassword) {
    throw new Error("New password is required");
  }

  if (newPassword.length < 6) {
    throw new Error(
      "Password must be at least 6 characters"
    );
  }

  // Hash received token so we can compare it
  // with the hashed token stored in MongoDB
  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: {
      $gt: new Date(),
    },
    isDeleted: {
      $ne: true,
    },
  });

  if (!user) {
    throw new Error(
      "Reset password link is invalid or has expired"
    );
  }

  const hashedPassword = await bcrypt.hash(
    newPassword,
    10
  );

  user.password = hashedPassword;

  // Reset Google-only account behavior if needed.
  // User can now also login using email/password.
  if (!user.authProvider) {
    user.authProvider = "local";
  }

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Logout existing sessions after password reset
  user.refreshToken = undefined;

  await user.save();

  // Send security email.
  // Password reset should still succeed even if
  // this email fails.
  try {
    await sendEmail({
      to: user.email,
      subject: "Your SkillPrep AI password was changed",
      html: getPasswordChangedEmailTemplate(user.name),
    });
  } catch (error) {
    console.error(
      "Password changed email failed:",
      error
    );
  }

  return {
    message: "Password reset successfully",
  };
};