import { Router } from "express";

import {
    register,
    login,
    getProfile,
    refreshToken,
    logout,
    googleLogin
} from "../controllers/auth.controller";

import { authMiddleware } from "../middleware/auth.middleware";

import {
    forgotPassword,
    resetPassword,
} from "../controllers/auth.controller";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.get("/profile", getProfile);

router.post("/forgot-password", forgotPassword);

router.post("/reset-password", resetPassword);

export default router;