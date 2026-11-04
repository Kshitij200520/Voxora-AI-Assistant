import { Router } from 'express';
import {
  register,
  login,
  logout,
  getMe,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', logout);
router.get('/me', requireAuth, getMe);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', authLimiter, requireAuth, resendVerification);
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/reset-password', passwordResetLimiter, resetPassword);

export default router;

