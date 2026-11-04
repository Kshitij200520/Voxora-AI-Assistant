import { Request, Response, NextFunction } from 'express';
import { Reminder } from '../models/Reminder';
import { logActivity } from '../services/activity.service';

export const getReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status, limit = 50, page = 1 } = req.query;

    const filter: any = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [reminders, totalCount] = await Promise.all([
      Reminder.find(filter).sort({ dueAt: 1 }).skip(skip).limit(limitNum),
      Reminder.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: reminders,
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

export const createReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, dueAt, status = 'scheduled', emailNotificationEnabled = true } = req.body;
    const userId = req.user!.id;

    const reminder = await Reminder.create({
      userId,
      title,
      description: description || '',
      dueAt: new Date(dueAt),
      status,
      notificationSent: false,
      emailNotificationEnabled: emailNotificationEnabled !== false,
      emailStatus: 'pending',
    });

    await logActivity({
      userId: req.user!.id,
      actionType: 'CREATE_REMINDER',
      description: `Created reminder "${title}"`,
      entityType: 'reminder',
      entityId: reminder._id.toString(),
      status: 'success',
      metadata: { title, dueAt },
    });

    res.status(201).json({ success: true, data: reminder });
  } catch (error) {
    next(error);
  }
};

export const updateReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await Reminder.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    await logActivity({
      userId: req.user!.id,
      actionType: 'UPDATE_REMINDER',
      description: `Updated reminder "${updated.title}" (Status: ${updated.status})`,
      entityType: 'reminder',
      entityId: updated._id.toString(),
      status: 'success',
      metadata: req.body,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    if (!reminder) {
      return res.status(404).json({ success: false, error: 'Reminder not found' });
    }

    await logActivity({
      userId: req.user!.id,
      actionType: 'DELETE_REMINDER',
      description: `Deleted reminder "${reminder.title}"`,
      entityType: 'reminder',
      entityId: reminder._id.toString(),
      status: 'success',
    });

    res.json({ success: true, message: 'Reminder deleted successfully', data: { id: reminder._id } });
  } catch (error) {
    next(error);
  }
};
