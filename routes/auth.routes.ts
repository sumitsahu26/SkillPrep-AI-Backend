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

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleLogin);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.get("/profile", getProfile);

export default router;