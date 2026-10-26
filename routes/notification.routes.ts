import { Router } from "express";

import {
    getNotifications,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    removeAllNotifications,
} from "../controllers/notification.controller";

import {
    getPreferences,
    updatePreferences,
} from "../controllers/notificationPreference.controller";

import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.get("/", authMiddleware, getNotifications);

router.get("/unread-count", authMiddleware, getUnreadCount);

router.patch("/:id/read", authMiddleware, markAsRead);

router.patch("/read-all", authMiddleware, markAllAsRead);

router.delete("/:id", authMiddleware, removeNotification);

router.delete("/", authMiddleware, removeAllNotifications);

router.get("/preferences", authMiddleware, getPreferences);

router.put("/preferences", authMiddleware, updatePreferences);

export default router;