import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/user.model";
import { OAuth2Client } from "google-auth-library";

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
  const { name, email, password } = data;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new Error("User already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

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

/* =========================================================
   GOOGLE LOGIN
========================================================= */

export const googleLoginUser = async (
  credential: string
) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    throw new Error("GOOGLE_CLIENT_ID is not configured");
  }

  // Verify Google ID token
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

  const normalizedEmail = email.toLowerCase().trim();

  /* =======================================================
     FIND EXISTING USER
  ======================================================= */

  let user = await User.findOne({
    email: normalizedEmail,
  });

  /* =======================================================
     CREATE GOOGLE USER
  ======================================================= */

  if (!user) {
    user = await User.create({
      name: name || normalizedEmail.split("@")[0],
      email: normalizedEmail,
      password: undefined,
      googleId,
      profileImage: picture || "",
      isAdmin: false,
      authProvider: "google",
    });
  } else {
    /* =====================================================
       LINK GOOGLE TO EXISTING ACCOUNT
    ===================================================== */

    if (!user.googleId) {
      user.googleId = googleId;
    }

    if (!user.profileImage && picture) {
      user.profileImage = picture;
    }

    user.authProvider = "google";

    await user.save();
  }

  /* =======================================================
     GENERATE APPLICATION JWT
  ======================================================= */

  const accessToken = generateAccessToken(
    user._id.toString(),
    user.isAdmin
  );

  const refreshToken = generateRefreshToken(
    user._id.toString()
  );

  /* =======================================================
     HASH REFRESH TOKEN
  ======================================================= */

  const hashedRefreshToken = await bcrypt.hash(
    refreshToken,
    10
  );

  user.refreshToken = hashedRefreshToken;

  await user.save();

  /* =======================================================
     RETURN SAME RESPONSE STRUCTURE AS NORMAL LOGIN
  ======================================================= */

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