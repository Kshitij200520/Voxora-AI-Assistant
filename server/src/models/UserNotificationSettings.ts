import { Schema, model, Document, Types } from 'mongoose';

export interface IUserNotificationSettings extends Document {
  userId: Types.ObjectId;
  emailRemindersEnabled: boolean;
  taskDeadlineAlertsEnabled: boolean;
  upcomingReminderAlertsEnabled: boolean;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserNotificationSettingsSchema = new Schema<IUserNotificationSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    emailRemindersEnabled: {
      type: Boolean,
      default: true,
    },
    taskDeadlineAlertsEnabled: {
      type: Boolean,
      default: false,
    },
    upcomingReminderAlertsEnabled: {
      type: Boolean,
      default: false,
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
  },
  {
    timestamps: true,
  }
);

export const UserNotificationSettings = model<IUserNotificationSettings>(
  'UserNotificationSettings',
  UserNotificationSettingsSchema
);

