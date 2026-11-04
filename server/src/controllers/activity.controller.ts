import { Request, Response, NextFunction } from 'express';
import { ActivityLog } from '../models/ActivityLog';

export const getActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { limit = 50, page = 1, entityType } = req.query;

    const filter: any = { userId };
    if (entityType && entityType !== 'all') {
      filter.entityType = entityType;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [logs, totalCount] = await Promise.all([
      ActivityLog.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      ActivityLog.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
