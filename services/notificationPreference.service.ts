import NotificationPreference from "../models/notificationPreference.model";

export interface UpdateNotificationPreferenceInput {
  interviewReminders?: boolean;
  mockInterviewResults?: boolean;
  resumeUpdates?: boolean;
  aiMentor?: boolean;
  roadmapUpdates?: boolean;
  skillAssessmentResults?: boolean;
  emailNotifications?: boolean;
}

export const getNotificationPreferences = async (
  userId: string
) => {
  let preferences =
    await NotificationPreference.findOne({
      userId,
    });

  if (!preferences) {
    preferences =
      await NotificationPreference.create({
        userId,
      });
  }

  return preferences;
};

export const updateNotificationPreferences = async (
  userId: string,
  data: UpdateNotificationPreferenceInput
) => {
  const allowedFields: UpdateNotificationPreferenceInput = {};

  if (typeof data.interviewReminders === "boolean") {
    allowedFields.interviewReminders =
      data.interviewReminders;
  }

  if (typeof data.mockInterviewResults === "boolean") {
    allowedFields.mockInterviewResults =
      data.mockInterviewResults;
  }

  if (typeof data.resumeUpdates === "boolean") {
    allowedFields.resumeUpdates =
      data.resumeUpdates;
  }

  if (typeof data.aiMentor === "boolean") {
    allowedFields.aiMentor = data.aiMentor;
  }

  if (typeof data.roadmapUpdates === "boolean") {
    allowedFields.roadmapUpdates =
      data.roadmapUpdates;
  }

  if (
    typeof data.skillAssessmentResults === "boolean"
  ) {
    allowedFields.skillAssessmentResults =
      data.skillAssessmentResults;
  }

  if (
    typeof data.emailNotifications === "boolean"
  ) {
    allowedFields.emailNotifications =
      data.emailNotifications;
  }

  return NotificationPreference.findOneAndUpdate(
    {
      userId,
    },
    {
      $set: allowedFields,
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );
};