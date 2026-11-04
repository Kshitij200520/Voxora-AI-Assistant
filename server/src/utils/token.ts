import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ENV } from '../config/env';

export interface TokenPayload {
  id: string;
  email: string;
}

export const generateAccessToken = (user: { _id: any; email: string }): string => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    ENV.JWT_SECRET,
    { expiresIn: '7d' } // Generous 7-day token for hackathon & seamless user experience
  );
};

export const generateRefreshToken = (user: { _id: any; email: string }): string => {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    ENV.JWT_REFRESH_SECRET,
    { expiresIn: '30d' }
  );
};

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_SECRET) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, ENV.JWT_REFRESH_SECRET) as TokenPayload;
};

export const generateRandomToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

