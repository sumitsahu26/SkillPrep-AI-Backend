import { Router } from "express";

import {
    register,
    login,
    getProfile,
    refreshToken,
    logout,
} from "../controllers/auth.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/refresh", refreshToken);

router.post("/logout", logout);

router.get("/profile", authMiddleware, getProfile
);

export default router;