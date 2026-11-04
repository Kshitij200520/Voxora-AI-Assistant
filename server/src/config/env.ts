import dotenv from 'dotenv';

dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  APP_URL: process.env.APP_URL || process.env.CLIENT_URL || 'http://localhost:5173',
  MONGODB_URI: process.env.MONGODB_URI || '',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  GROQ_MODEL: process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
  JWT_SECRET: process.env.JWT_SECRET || 'voxora_super_secure_jwt_secret_key_2026_x8932',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'voxora_super_secure_refresh_token_secret_key_2026_q203',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'VOXORA AI <onboarding@resend.dev>',
  EMAIL_USER: process.env.EMAIL_USER || '',
  EMAIL_PASS: process.env.EMAIL_PASS || '',
  NOTIFICATION_EMAIL: process.env.NOTIFICATION_EMAIL || '',
};
