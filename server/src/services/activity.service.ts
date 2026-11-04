import { ActivityLog, ActivityEntityType, ActivityStatus } from '../models/ActivityLog';
import { getDatabaseStatus } from '../config/db';
import { Types } from 'mongoose';

export const logActivity = async (params: {
  userId?: string | Types.ObjectId | null;
  actionType: string;
  description: string;
  entityType: ActivityEntityType;
  entityId?: string | null;
  status?: ActivityStatus;
  metadata?: Record<string, any>;
}): Promise<void> => {
  try {
    const { connected } = getDatabaseStatus();
    if (!connected) {
      console.warn('⚠️ [ActivityLog] Skipping activity log write: database disconnected');
      return;
    }

    await ActivityLog.create({
      userId: params.userId || null,
      actionType: params.actionType,
      description: params.description,
      entityType: params.entityType,
      entityId: params.entityId || null,
      status: params.status || 'success',
      metadata: params.metadata || {},
      createdAt: new Date(),
    });
  } catch (err: any) {
    console.error('❌ [ActivityLog] Failed to record activity log:', err.message);
  }
};
