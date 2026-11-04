import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User, IUser } from '../models/User';
import { UserNotificationSettings } from '../models/UserNotificationSettings';
import { generateAccessToken, generateRefreshToken, generateRandomToken, hashToken } from '../utils/token';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { logActivity } from '../services/activity.service';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, email, password, timezone = 'Asia/Kolkata' } = req.body;

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
    }

    // Hash password with bcryptjs
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate email verification token
    const rawVerificationToken = generateRandomToken();
    const emailVerificationTokenHash = hashToken(rawVerificationToken);
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await User.create({
      fullName: fullName.trim(),
      email: normalizedEmail,
      passwordHash,
      isEmailVerified: false,
      emailVerificationTokenHash,
      emailVerificationExpires,
      timezone,
    });

    // Create default notification settings for user
    await UserNotificationSettings.create({
      userId: user._id,
      emailRemindersEnabled: true,
      taskDeadlineAlertsEnabled: false,
      upcomingReminderAlertsEnabled: false,
      timezone,
    });

    // Send verification email
    try {
      await sendVerificationEmail(user, rawVerificationToken);
    } catch (e: any) {
      console.warn('⚠️ [Auth] Could not send verification email immediately:', e.message);
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set cookie
    res.cookie('accessToken', accessToken, COOKIE_OPTIONS);

    await logActivity({
      userId: user._id,
      actionType: 'USER_REGISTER',
      description: `New user account created: ${user.email}`,
      entityType: 'auth',
      entityId: user._id.toString(),
      status: 'success',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Please verify your email.',
      accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, rememberMe } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    // Query user including passwordHash
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password.',
      });
    }

    const accessToken = generateAccessToken(user);
    const cookieAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
    res.cookie('accessToken', accessToken, { ...COOKIE_OPTIONS, maxAge: cookieAge });

    await logActivity({
      userId: user._id,
      actionType: 'USER_LOGIN',
      description: `User logged in: ${user.email}`,
      entityType: 'auth',
      entityId: user._id.toString(),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Logged in successfully',
      accessToken,
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('accessToken', COOKIE_OPTIONS);
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const settings = await UserNotificationSettings.findOne({ userId: user._id });

    res.json({
      success: true,
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
        profileImage: user.profileImage,
        createdAt: user.createdAt,
        notificationSettings: settings || {
          emailRemindersEnabled: true,
          taskDeadlineAlertsEnabled: false,
          upcomingReminderAlertsEnabled: false,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ success: false, error: 'Verification token is required' });
    }

    const tokenHash = hashToken(token);
    const user = await User.findOne({
      emailVerificationTokenHash: tokenHash,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired email verification token. Please request a new one.',
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationTokenHash = null;
    user.emailVerificationExpires = null;
    await user.save();

    await logActivity({
      userId: user._id,
      actionType: 'EMAIL_VERIFIED',
      description: `Email verified for ${user.email}`,
      entityType: 'auth',
      entityId: user._id.toString(),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Email verified successfully! You can now receive automated email reminders.',
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ success: false, error: 'Your email address is already verified.' });
    }

    const rawToken = generateRandomToken();
    user.emailVerificationTokenHash = hashToken(rawToken);
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerificationEmail(user, rawToken);

    res.json({
      success: true,
      message: `Verification link sent to ${user.email}. Please check your inbox.`,
    });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return success message to prevent user enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account exists with that email address, a password reset link has been sent.',
      });
    }

    const rawToken = generateRandomToken();
    user.passwordResetTokenHash = hashToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(user, rawToken);

    res.json({
      success: true,
      message: 'If an account exists with that email address, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { token, password } = req.body;
    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetTokenHash: tokenHash,
      passwordResetExpires: { $gt: new Date() },
    }).select('+passwordHash');

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired password reset token. Please request a new link.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(password, salt);
    user.passwordResetTokenHash = null;
    user.passwordResetExpires = null;
    await user.save();

    await logActivity({
      userId: user._id,
      actionType: 'PASSWORD_RESET',
      description: `Password reset successfully for ${user.email}`,
      entityType: 'auth',
      entityId: user._id.toString(),
      status: 'success',
    });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};

