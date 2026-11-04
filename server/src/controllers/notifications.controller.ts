import { Request, Response } from 'express';
import { UserNotificationSettings } from '../models/UserNotificationSettings';
import { User } from '../models/User';
import { Reminder } from '../models/Reminder';
import { sendTestNotificationEmail } from '../services/email.service';
import { NotificationSettingsSchema } from '../validators/auth.validator';

export const getNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    let settings = await UserNotificationSettings.findOne({ userId });
    if (!settings) {
      settings = await UserNotificationSettings.create({
        userId,
        emailRemindersEnabled: true,
        taskDeadlineAlertsEnabled: false,
        upcomingReminderAlertsEnabled: false,
        timezone: req.user!.timezone || 'Asia/Kolkata',
      });
    }

    const user = await User.findById(userId).select('email isEmailVerified fullName');

    return res.json({
      success: true,
      data: {
        settings,
        user: {
          email: user?.email,
          isEmailVerified: user?.isEmailVerified,
          fullName: user?.fullName,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch notification settings',
    });
  }
};

export const updateNotificationSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const validatedData = NotificationSettingsSchema.parse(req.body);

    const settings = await UserNotificationSettings.findOneAndUpdate(
      { userId },
      { $set: validatedData },
      { new: true, upsert: true }
    );

    if (validatedData.timezone) {
      await User.findByIdAndUpdate(userId, { timezone: validatedData.timezone });
    }

    return res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: settings,
    });
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      error: err.errors ? err.errors[0].message : err.message || 'Failed to update preferences',
    });
  }
};

export const sendTestNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const result = await sendTestNotificationEmail(user);

    return res.json({
      success: result.success,
      message: result.message,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send test notification',
    });
  }
};

export const getNotificationHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;

    const history = await Reminder.find({
      userId,
      emailStatus: { $in: ['sent', 'failed', 'processing', 'skipped'] },
    })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select('title dueAt status emailStatus emailSentAt emailError createdAt');

    return res.json({
      success: true,
      data: history,
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to fetch notification history',
    });
  }
};

