import { Types } from "mongoose";
import Notification, {
  NotificationType,
} from "../models/notification.model";
import NotificationPreference from "../models/notificationPreference.model";

interface CreateNotificationInput {
  userId: string;
  title: string;
  description: string;
  type?: NotificationType;
  link?: string;
  preferenceKey?:
  | "interviewReminders"
  | "mockInterviewResults"
  | "resumeUpdates"
  | "aiMentor"
  | "roadmapUpdates"
  | "skillAssessmentResults";
}

export const createNotification = async (
    data: CreateNotificationInput
  ) => {
    if (data.preferenceKey) {
      const preferences =
        await NotificationPreference.findOne({
          userId: data.userId,
        }).lean();
  
      if (
        preferences &&
        preferences[data.preferenceKey] === false
      ) {
        return null;
      }
    }
  
    return Notification.create({
      userId: new Types.ObjectId(data.userId),
      title: data.title,
      description: data.description,
      type: data.type || "system",
      link: data.link,
    });
  };

export const getUserNotifications = async (
  userId: string,
  limit = 20
) => {
  return Notification.find({
    userId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();
};

export const getUnreadNotificationCount = async (
  userId: string
) => {
  return Notification.countDocuments({
    userId,
    isRead: false,
  });
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  return Notification.findOneAndUpdate(
    {
      _id: notificationId,
      userId,
    },
    {
      $set: {
        isRead: true,
      },
    },
    {
      new: true,
    }
  );
};

export const markAllNotificationsAsRead = async (
  userId: string
) => {
  return Notification.updateMany(
    {
      userId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
      },
    }
  );
};

export const deleteNotification = async (
  userId: string,
  notificationId: string
) => {
  return Notification.findOneAndDelete({
    _id: notificationId,
    userId,
  });
};

export const deleteAllNotifications = async (
  userId: string
) => {
  return Notification.deleteMany({
    userId,
  });
};