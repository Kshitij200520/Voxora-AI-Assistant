import { Schema, model, Document, Types } from 'mongoose';

export type ReminderStatus = 'scheduled' | 'completed' | 'delivered';
export type EmailDeliveryStatus = 'pending' | 'processing' | 'sent' | 'failed' | 'skipped';

export interface IReminder extends Document {
  userId?: Types.ObjectId;
  title: string;
  description: string;
  dueAt: Date;
  status: ReminderStatus;
  notificationSent: boolean;
  emailNotificationEnabled: boolean;
  emailStatus: EmailDeliveryStatus;
  emailSentAt?: Date | null;
  emailError?: string | null;
  claimToken?: string | null;
  claimExpires?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderSchema = new Schema<IReminder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Reminder title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    dueAt: {
      type: Date,
      required: [true, 'Due date and time is required'],
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'delivered'],
      default: 'scheduled',
      index: true,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    emailNotificationEnabled: {
      type: Boolean,
      default: true,
    },
    emailStatus: {
      type: String,
      enum: ['pending', 'processing', 'sent', 'failed', 'skipped'],
      default: 'pending',
      index: true,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
    emailError: {
      type: String,
      default: null,
    },
    claimToken: {
      type: String,
      default: null,
    },
    claimExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

ReminderSchema.index({ userId: 1, status: 1, dueAt: 1 });
ReminderSchema.index({ dueAt: 1, emailStatus: 1 });

export const Reminder = model<IReminder>('Reminder', ReminderSchema);
