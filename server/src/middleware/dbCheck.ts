import { Request, Response, NextFunction } from 'express';
import { getDatabaseStatus } from '../config/db';

export const requireDatabase = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const status = getDatabaseStatus();
  if (!status.connected) {
    return res.status(503).json({
      success: false,
      error: 'Database is not connected. Please verify your MONGODB_URI in server configuration.',
      databaseStatus: status,
    });
  }
  next();
};

