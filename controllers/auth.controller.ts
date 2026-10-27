import { Request, Response } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  refreshAccessToken,
  logoutUser,
  googleLoginUser,
  resetPasswordUser,
  forgotPasswordUser,
} from "../services/auth.service";
import { AuthRequest } from "../middleware/auth.middleware";

export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
      return;
    }

    const user = await registerUser({
      name,
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    if (message === "User already exists") {
      res.status(409).json({
        success: false,
        message,
      });
      return;
    }

    console.error("Register error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
      return;
    }

    const result = await loginUser({
      email,
      password,
    });

    // Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    // Invalid credentials
    if (message === "Invalid email or password") {
      res.status(401).json({
        success: false,
        message,
      });
      return;
    }

    // Deleted account
    if (message === "This account has been deleted.") {
      res.status(403).json({
        success: false,
        message,
      });
      return;
    }

    // Google-only account
    if (
      message ===
      "This account uses Google login. Please continue with Google."
    ) {
      res.status(400).json({
        success: false,
        message,
      });
      return;
    }

    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const googleLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { credential } = req.body;

    if (!credential) {
      res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
      return;
    }

    const result = await googleLoginUser(credential);

    // Store refresh token in HTTP-only cookie
    res.cookie("refreshToken", result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Google login successful",
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (error) {
    console.error("Google login error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Google login failed";

    res.status(401).json({
      success: false,
      message,
    });
  }
};

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
      return;
    }

    const user = await getUserProfile(userId);

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";

    if (message === "User not found") {
      res.status(404).json({
        success: false,
        message,
      });
      return;
    }

    console.error("Profile error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
      return;
    }

    const accessToken =
      await refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      accessToken,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Invalid refresh token";

    res.status(401).json({
      success: false,
      message,
    });
  }
};

export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      await logoutUser(refreshToken);
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production"
          ? "none"
          : "lax",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    if (
      !email ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      res.status(400).json({
        success: false,
        message: "Email is required",
      });
      return;
    }

    await forgotPasswordUser(email);

    res.status(200).json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    res.status(500).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to process password reset request",
    });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (
      !token ||
      typeof token !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Reset token is required",
      });
      return;
    }

    if (
      !password ||
      typeof password !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Password is required",
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters",
      });
      return;
    }

    await resetPasswordUser(
      token,
      password
    );

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(400).json({
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to reset password",
    });
  }
};
