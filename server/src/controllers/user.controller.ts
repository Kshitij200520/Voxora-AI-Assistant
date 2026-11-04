import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { Expense } from '../models/Expense';
import { Task } from '../models/Task';
import { Reminder } from '../models/Reminder';
import { ActivityLog } from '../models/ActivityLog';
import { UserNotificationSettings } from '../models/UserNotificationSettings';

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

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
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { fullName, timezone, profileImage } = req.body;

    const updateData: any = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (timezone) updateData.timezone = timezone.trim();
    if (profileImage !== undefined) updateData.profileImage = profileImage;

    const user = await User.findByIdAndUpdate(req.user!.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Keep timezone in notification settings synced
    if (timezone) {
      await UserNotificationSettings.findOneAndUpdate(
        { userId: user._id },
        { timezone },
        { upsert: true }
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
        timezone: user.timezone,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user!.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect.',
      });
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAccount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { password } = req.body;

    const user = await User.findById(req.user!.id).select('+passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Incorrect password. Account deletion aborted.',
      });
    }

    const userId = user._id;

    // Delete all user scoped data cleanly
    await Promise.all([
      Expense.deleteMany({ userId }),
      Task.deleteMany({ userId }),
      Reminder.deleteMany({ userId }),
      ActivityLog.deleteMany({ userId }),
      UserNotificationSettings.deleteMany({ userId }),
      User.findByIdAndDelete(userId),
    ]);

    res.clearCookie('accessToken');

    res.json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    next(error);
  }
};

