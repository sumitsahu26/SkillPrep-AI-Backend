import { Router, } from "express";

import { authMiddleware, } from "../middleware/auth.middleware";

import {
    generateCareerMonitorAnalysis,
    getCareerMonitorHistory,
    getCareerMonitorSnapshot,
    getCurrentCareerMonitor,
    removeCareerMonitorSnapshot,
} from "../controllers/careerMonitor.controller";

const router = Router();

router.get("/", authMiddleware, getCurrentCareerMonitor);

router.post("/analyze", authMiddleware, generateCareerMonitorAnalysis);

router.get("/history", authMiddleware, getCareerMonitorHistory);

router.get("/history/:id", authMiddleware, getCareerMonitorSnapshot);

router.delete("/history/:id", authMiddleware, removeCareerMonitorSnapshot);

export default router;