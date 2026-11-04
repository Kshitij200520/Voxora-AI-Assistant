import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/token';
import { User, IUser } from '../models/User';
import { getDatabaseStatus } from '../config/db';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  isEmailVerified: boolean;
  timezone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { connected } = getDatabaseStatus();
    if (!connected) {
      return res.status(503).json({
        success: false,
        error: 'Database is not connected. Authentication cannot be verified.',
      });
    }

    let token: string | undefined;

    // 1. Check Authorization Header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    // 2. Check cookies
    else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
      token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to continue.',
      });
    }

    let payload: { id: string; email: string };
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: 'Session expired or invalid token. Please log in again.',
      });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User account no longer exists.',
      });
    }

    req.user = {
      id: user._id.toString(),
      email: user.email,
      fullName: user.fullName,
      isEmailVerified: user.isEmailVerified,
      timezone: user.timezone || 'Asia/Kolkata',
    };

    next();
  } catch (error: any) {
    console.error('❌ [Auth Middleware Error]:', error.message);
    res.status(500).json({
      success: false,
      error: 'Authentication verification failed.',
    });
  }
};

export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.accessToken || req.cookies.token)) {
      token = req.cookies.accessToken || req.cookies.token;
    }

    if (!token) {
      return next();
    }

    try {
      const payload = verifyAccessToken(token);
      const user = await User.findById(payload.id);
      if (user) {
        req.user = {
          id: user._id.toString(),
          email: user.email,
          fullName: user.fullName,
          isEmailVerified: user.isEmailVerified,
          timezone: user.timezone || 'Asia/Kolkata',
        };
      }
    } catch {
      // Token invalid or expired, continue as unauthenticated
    }

    next();
  } catch {
    next();
  }
};

