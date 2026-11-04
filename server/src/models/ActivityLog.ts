import { Schema, model, Document, Types } from 'mongoose';

export type ActivityEntityType = 'expense' | 'task' | 'reminder' | 'system' | 'query' | 'auth';
export type ActivityStatus = 'success' | 'failed' | 'partial' | 'pending_confirmation';

export interface IActivityLog extends Document {
  userId?: Types.ObjectId | null;
  actionType: string;
  description: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  status: ActivityStatus;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    actionType: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['expense', 'task', 'reminder', 'system', 'query', 'auth'],
      required: true,
    },
    entityId: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['success', 'failed', 'partial', 'pending_confirmation'],
      default: 'success',
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

ActivityLogSchema.index({ userId: 1, createdAt: -1 });

export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);
