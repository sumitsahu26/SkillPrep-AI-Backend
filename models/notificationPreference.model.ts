import mongoose, {
    Document,
    Schema,
    Types,
} from "mongoose";

export interface INotificationPreference
    extends Document {
    userId: Types.ObjectId;

    interviewReminders: boolean;
    mockInterviewResults: boolean;
    resumeUpdates: boolean;
    aiMentor: boolean;
    roadmapUpdates: boolean;
    skillAssessmentResults: boolean;

    emailNotifications: boolean;

    createdAt: Date;
    updatedAt: Date;
}

const notificationPreferenceSchema =
    new Schema<INotificationPreference>(
        {
            userId: {
                type: Schema.Types.ObjectId,
                ref: "User",
                required: true,
                unique: true,
                index: true,
            },

            interviewReminders: {
                type: Boolean,
                default: true,
            },

            mockInterviewResults: {
                type: Boolean,
                default: true,
            },

            resumeUpdates: {
                type: Boolean,
                default: true,
            },

            aiMentor: {
                type: Boolean,
                default: true,
            },

            roadmapUpdates: {
                type: Boolean,
                default: true,
            },

            skillAssessmentResults: {
                type: Boolean,
                default: true,
            },

            emailNotifications: {
                type: Boolean,
                default: false,
            },
        },
        {
            timestamps: true,
        }
    );

const NotificationPreference =
    mongoose.models.NotificationPreference ||
    mongoose.model<INotificationPreference>(
        "NotificationPreference",
        notificationPreferenceSchema
    );

export default NotificationPreference;