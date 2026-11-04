import { Request, Response, NextFunction } from 'express';
import { Task } from '../models/Task';
import { logActivity } from '../services/activity.service';

export const getTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { status, priority, search, limit = 50, page = 1 } = req.query;

    const filter: any = { userId };

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (priority && priority !== 'all') {
      filter.priority = priority;
    }

    if (search) {
      filter.title = { $regex: new RegExp(String(search), 'i') };
    }

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [tasks, totalCount] = await Promise.all([
      Task.find(filter).sort({ status: 1, dueDate: 1, createdAt: -1 }).skip(skip).limit(limitNum),
      Task.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: tasks,
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

export const getTaskById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const createTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, priority, status, dueDate } = req.body;
    const userId = req.user!.id;

    const task = await Task.create({
      userId,
      title,
      description: description || '',
      priority: priority || 'medium',
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    await logActivity({
      userId: req.user!.id,
      actionType: 'CREATE_TASK',
      description: `Created task "${title}"`,
      entityType: 'task',
      entityId: task._id.toString(),
      status: 'success',
      metadata: { title, priority: task.priority },
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

export const updateTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await Task.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await logActivity({
      userId: req.user!.id,
      actionType: 'UPDATE_TASK',
      description: `Updated task "${updated.title}" (Status: ${updated.status})`,
      entityType: 'task',
      entityId: updated._id.toString(),
      status: 'success',
      metadata: req.body,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteTask = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }

    await logActivity({
      userId: req.user!.id,
      actionType: 'DELETE_TASK',
      description: `Deleted task "${task.title}"`,
      entityType: 'task',
      entityId: task._id.toString(),
      status: 'success',
    });

    res.json({ success: true, message: 'Task deleted successfully', data: { id: task._id } });
  } catch (error) {
    next(error);
  }
};
