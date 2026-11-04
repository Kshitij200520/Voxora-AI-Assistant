import { Types } from 'mongoose';
import { Expense, IExpense } from '../models/Expense';
import { Task, ITask } from '../models/Task';
import { Reminder, IReminder } from '../models/Reminder';
import { logActivity } from './activity.service';
import { getDatabaseStatus } from '../config/db';
import { ActionItem } from '../validators/ai.validator';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';

export interface ActionResult {
  id?: string;
  type: string;
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'AWAITING_CONFIRMATION';
  message: string;
  data?: any;
  requiresConfirmation?: boolean;
  confirmationDetails?: {
    entityType: string;
    entityId: string;
    title: string;
    message: string;
  };
}

export interface ExecutionResponse {
  overallStatus: 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'AWAITING_CONFIRMATION';
  results: ActionResult[];
  spokenResponse: string;
  timestamp: string;
}

export class ActionExecutorService {
  /**
   * Executes a list of action items sequentially, returning independent statuses.
   */
  public static async executeActions(
    actions: ActionItem[],
    options: { confirmed?: boolean; language?: string; userId?: string; timezone?: string } = {}
  ): Promise<ExecutionResponse> {
    const { connected } = getDatabaseStatus();
    if (!connected) {
      return {
        overallStatus: 'FAILED',
        results: actions.map((a) => ({
          type: a.type,
          success: false,
          status: 'FAILED',
          message: 'Database is disconnected. Please configure MONGODB_URI to execute actions.',
        })),
        spokenResponse:
          'I understood your request, but the database is currently disconnected. Please connect MongoDB to save your data.',
        timestamp: new Date().toISOString(),
      };
    }

    if (!actions || actions.length === 0) {
      return {
        overallStatus: 'SUCCESS',
        results: [],
        spokenResponse: 'No specific actions were identified to execute.',
        timestamp: new Date().toISOString(),
      };
    }

    const results: ActionResult[] = [];
    const spokenMessages: string[] = [];
    let hasConfirmationPending = false;

    for (const action of actions) {
      try {
        const result = await this.executeSingleAction(action, options);
        results.push(result);
        if (result.status === 'AWAITING_CONFIRMATION') {
          hasConfirmationPending = true;
          spokenMessages.push(result.message);
        } else if (result.success) {
          spokenMessages.push(result.message);
        } else {
          spokenMessages.push(`Failed to process ${action.type}: ${result.message}`);
        }
      } catch (err: any) {
        results.push({
          type: action.type,
          success: false,
          status: 'FAILED',
          message: err.message || 'An unexpected error occurred during execution.',
        });
        spokenMessages.push(`Could not execute ${action.type}.`);
      }
    }

    // Determine overall status
    const successCount = results.filter((r) => r.success).length;
    const totalCount = results.length;

    let overallStatus: ExecutionResponse['overallStatus'] = 'FAILED';
    if (hasConfirmationPending) {
      overallStatus = 'AWAITING_CONFIRMATION';
    } else if (successCount === totalCount) {
      overallStatus = 'SUCCESS';
    } else if (successCount > 0) {
      overallStatus = 'PARTIAL_SUCCESS';
    }

    const finalSpokenResponse = spokenMessages.join(' ') || 'Completed execution.';

    return {
      overallStatus,
      results,
      spokenResponse: finalSpokenResponse,
      timestamp: new Date().toISOString(),
    };
  }

  private static async executeSingleAction(
    action: ActionItem,
    options: { confirmed?: boolean; language?: string; userId?: string; timezone?: string }
  ): Promise<ActionResult> {
    const { userId, timezone = 'Asia/Kolkata' } = options;

    switch (action.type) {
      case 'CREATE_EXPENSE':
        return await this.createExpense(action.payload, userId);

      case 'UPDATE_EXPENSE':
        return await this.updateExpense(action.payload, userId);

      case 'DELETE_EXPENSE':
        return await this.deleteExpense(action.payload, userId, options.confirmed);

      case 'CREATE_TASK':
        return await this.createTask(action.payload, userId);

      case 'UPDATE_TASK':
        return await this.updateTask(action.payload, userId);

      case 'COMPLETE_TASK':
        return await this.completeTask(action.payload, userId);

      case 'DELETE_TASK':
        return await this.deleteTask(action.payload, userId, options.confirmed);

      case 'CREATE_REMINDER':
        return await this.createReminder(action.payload, userId, timezone);

      case 'UPDATE_REMINDER':
        return await this.updateReminder(action.payload, userId, timezone);

      case 'DELETE_REMINDER':
        return await this.deleteReminder(action.payload, userId, options.confirmed, timezone);

      case 'QUERY_EXPENSES':
        return await this.queryExpenses(action.payload, userId);

      case 'QUERY_TASKS':
        return await this.queryTasks(action.payload, userId);

      case 'QUERY_SUMMARY':
        return await this.querySummary(userId);

      case 'CHAT':
        return {
          type: 'CHAT',
          success: true,
          status: 'SUCCESS',
          message: '',
        };

      case 'UNKNOWN':
      default:
        return {
          type: action.type,
          success: true,
          status: 'SUCCESS',
          message: 'Understood, but no database changes were requested.',
        };
    }
  }

  // --- EXPENSE HANDLERS ---
  private static async createExpense(payload: any, userId?: string): Promise<ActionResult> {
    const amount = Number(payload.amount);
    if (isNaN(amount) || amount <= 0) {
      return {
        type: 'CREATE_EXPENSE',
        success: false,
        status: 'FAILED',
        message: 'Invalid expense amount. A positive number is required.',
      };
    }

    const description = (payload.description || 'General Expense').trim();
    const category = payload.category || 'Other';
    const date = payload.date ? new Date(payload.date) : new Date();

    const expense = await Expense.create({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      amount,
      currency: payload.currency || 'INR',
      category,
      description,
      date,
    });

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'CREATE_EXPENSE',
      description: `Added expense of ₹${amount.toLocaleString('en-IN')} for ${description} (${category})`,
      entityType: 'expense',
      entityId: expense._id.toString(),
      status: 'success',
      metadata: { amount, category, description, date },
    });

    return {
      id: expense._id.toString(),
      type: 'CREATE_EXPENSE',
      success: true,
      status: 'SUCCESS',
      message: `Added ₹${amount.toLocaleString('en-IN')} for ${description}.`,
      data: expense,
    };
  }

  private static async updateExpense(payload: any, userId?: string): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: IExpense | null = null;
    if (payload.expenseId) {
      target = await Expense.findOne({ _id: payload.expenseId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Expense.findOne({
        ...baseFilter,
        description: { $regex: new RegExp(payload.targetSearch, 'i') },
      }).sort({ date: -1 });
    } else {
      target = await Expense.findOne(baseFilter).sort({ date: -1 });
    }

    if (!target) {
      return {
        type: 'UPDATE_EXPENSE',
        success: false,
        status: 'FAILED',
        message: `Could not find expense "${payload.targetSearch || 'recent'}" to update.`,
      };
    }

    if (payload.amount) target.amount = Number(payload.amount);
    if (payload.category) target.category = payload.category;
    if (payload.description) target.description = payload.description.trim();
    if (payload.date) target.date = new Date(payload.date);

    await target.save();

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'UPDATE_EXPENSE',
      description: `Updated expense "${target.description}" to ₹${target.amount}`,
      entityType: 'expense',
      entityId: target._id.toString(),
      status: 'success',
    });

    return {
      id: target._id.toString(),
      type: 'UPDATE_EXPENSE',
      success: true,
      status: 'SUCCESS',
      message: `Updated ${target.description} expense to ₹${target.amount.toLocaleString('en-IN')}.`,
      data: target,
    };
  }

  private static async deleteExpense(payload: any, userId?: string, confirmed?: boolean): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: IExpense | null = null;

    if (payload.expenseId) {
      target = await Expense.findOne({ _id: payload.expenseId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Expense.findOne({
        ...baseFilter,
        description: { $regex: new RegExp(payload.targetSearch, 'i') },
      }).sort({ date: -1 });
    }

    if (!target) {
      return {
        type: 'DELETE_EXPENSE',
        success: false,
        status: 'FAILED',
        message: `Could not find an expense matching "${payload.targetSearch || 'the criteria'}".`,
      };
    }

    // Check confirmation requirement
    if (!confirmed) {
      return {
        id: target._id.toString(),
        type: 'DELETE_EXPENSE',
        success: false,
        status: 'AWAITING_CONFIRMATION',
        requiresConfirmation: true,
        message: `Are you sure you want to delete your ${target.description} expense of ₹${target.amount.toLocaleString('en-IN')}?`,
        confirmationDetails: {
          entityType: 'expense',
          entityId: target._id.toString(),
          title: `Delete Expense: ${target.description}`,
          message: `Confirm deleting ₹${target.amount.toLocaleString('en-IN')} (${target.category}) recorded on ${new Date(target.date).toLocaleDateString()}.`,
        },
      };
    }

    await Expense.findByIdAndDelete(target._id);

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'DELETE_EXPENSE',
      description: `Deleted expense of ₹${target.amount.toLocaleString('en-IN')} for ${target.description}`,
      entityType: 'expense',
      entityId: target._id.toString(),
      status: 'success',
      metadata: { deletedExpense: target.toObject() },
    });

    return {
      id: target._id.toString(),
      type: 'DELETE_EXPENSE',
      success: true,
      status: 'SUCCESS',
      message: `Deleted your ${target.description} expense of ₹${target.amount.toLocaleString('en-IN')}.`,
      data: { id: target._id },
    };
  }

  // --- TASK HANDLERS ---
  private static async createTask(payload: any, userId?: string): Promise<ActionResult> {
    const title = (payload.title || '').trim();
    if (!title) {
      return {
        type: 'CREATE_TASK',
        success: false,
        status: 'FAILED',
        message: 'Task title is required.',
      };
    }

    const task = await Task.create({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      title,
      description: (payload.description || '').trim(),
      priority: ['low', 'medium', 'high'].includes(payload.priority)
        ? payload.priority
        : 'medium',
      status: 'pending',
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
    });

    const dueFormatted = task.dueDate ? ` by ${new Date(task.dueDate).toLocaleDateString()}` : '';

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'CREATE_TASK',
      description: `Created task "${title}"${dueFormatted} (${task.priority} priority)`,
      entityType: 'task',
      entityId: task._id.toString(),
      status: 'success',
      metadata: { title, priority: task.priority, dueDate: task.dueDate },
    });

    return {
      id: task._id.toString(),
      type: 'CREATE_TASK',
      success: true,
      status: 'SUCCESS',
      message: `Created task "${title}"${dueFormatted}.`,
      data: task,
    };
  }

  private static async completeTask(payload: any, userId?: string): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: ITask | null = null;

    if (payload.taskId) {
      target = await Task.findOne({ _id: payload.taskId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Task.findOne({
        ...baseFilter,
        title: { $regex: new RegExp(payload.targetSearch, 'i') },
        status: { $ne: 'completed' },
      }).sort({ createdAt: -1 });

      if (!target) {
        target = await Task.findOne({
          ...baseFilter,
          title: { $regex: new RegExp(payload.targetSearch, 'i') },
        }).sort({ createdAt: -1 });
      }
    }

    if (!target) {
      return {
        type: 'COMPLETE_TASK',
        success: false,
        status: 'FAILED',
        message: `Could not find an active task matching "${payload.targetSearch || 'the title'}".`,
      };
    }

    target.status = 'completed';
    await target.save();

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'COMPLETE_TASK',
      description: `Marked task "${target.title}" as completed`,
      entityType: 'task',
      entityId: target._id.toString(),
      status: 'success',
      metadata: { title: target.title },
    });

    return {
      id: target._id.toString(),
      type: 'COMPLETE_TASK',
      success: true,
      status: 'SUCCESS',
      message: `Marked your task "${target.title}" as completed.`,
      data: target,
    };
  }

  private static async updateTask(payload: any, userId?: string): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: ITask | null = null;
    if (payload.taskId) {
      target = await Task.findOne({ _id: payload.taskId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Task.findOne({
        ...baseFilter,
        title: { $regex: new RegExp(payload.targetSearch, 'i') },
      }).sort({ createdAt: -1 });
    } else {
      target = await Task.findOne({ ...baseFilter, status: { $ne: 'completed' } }).sort({ createdAt: -1 });
    }

    if (!target) {
      return {
        type: 'UPDATE_TASK',
        success: false,
        status: 'FAILED',
        message: `Could not find task "${payload.targetSearch || 'active'}" to update.`,
      };
    }

    if (payload.newTitle || payload.title) target.title = (payload.newTitle || payload.title).trim();
    if (payload.priority) target.priority = payload.priority;
    if (payload.status) target.status = payload.status;
    if (payload.dueDate || payload.newDueDate) target.dueDate = new Date(payload.dueDate || payload.newDueDate);

    await target.save();

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'UPDATE_TASK',
      description: `Updated task "${target.title}" (${target.priority} priority)`,
      entityType: 'task',
      entityId: target._id.toString(),
      status: 'success',
    });

    return {
      id: target._id.toString(),
      type: 'UPDATE_TASK',
      success: true,
      status: 'SUCCESS',
      message: `Updated task "${target.title}".`,
      data: target,
    };
  }

  private static async deleteTask(payload: any, userId?: string, confirmed?: boolean): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: ITask | null = null;

    if (payload.taskId) {
      target = await Task.findOne({ _id: payload.taskId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Task.findOne({
        ...baseFilter,
        title: { $regex: new RegExp(payload.targetSearch, 'i') },
      }).sort({ createdAt: -1 });
    }

    if (!target) {
      return {
        type: 'DELETE_TASK',
        success: false,
        status: 'FAILED',
        message: `Could not find a task matching "${payload.targetSearch || 'the search'}".`,
      };
    }

    if (!confirmed) {
      return {
        id: target._id.toString(),
        type: 'DELETE_TASK',
        success: false,
        status: 'AWAITING_CONFIRMATION',
        requiresConfirmation: true,
        message: `Are you sure you want to delete the task "${target.title}"?`,
        confirmationDetails: {
          entityType: 'task',
          entityId: target._id.toString(),
          title: `Delete Task: ${target.title}`,
          message: `Confirm deleting this task. This action cannot be undone.`,
        },
      };
    }

    await Task.findByIdAndDelete(target._id);

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'DELETE_TASK',
      description: `Deleted task "${target.title}"`,
      entityType: 'task',
      entityId: target._id.toString(),
      status: 'success',
    });

    return {
      id: target._id.toString(),
      type: 'DELETE_TASK',
      success: true,
      status: 'SUCCESS',
      message: `Deleted task "${target.title}".`,
      data: { id: target._id },
    };
  }

  // --- REMINDER HANDLERS ---
  private static async createReminder(payload: any, userId?: string, timezone: string = 'Asia/Kolkata'): Promise<ActionResult> {
    const title = (payload.title || '').trim();
    if (!title) {
      return {
        type: 'CREATE_REMINDER',
        success: false,
        status: 'FAILED',
        message: 'Reminder title is required.',
      };
    }

    if (!payload.dueAt) {
      return {
        type: 'CREATE_REMINDER',
        success: false,
        status: 'FAILED',
        message: 'A scheduled date and time is required for reminders.',
      };
    }

    const dueAt = new Date(payload.dueAt);
    if (isNaN(dueAt.getTime())) {
      return {
        type: 'CREATE_REMINDER',
        success: false,
        status: 'FAILED',
        message: 'Invalid reminder date and time provided.',
      };
    }

    const reminder = await Reminder.create({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      title,
      description: (payload.description || '').trim(),
      dueAt,
      status: 'scheduled',
      notificationSent: false,
      emailNotificationEnabled: true,
      emailStatus: 'pending',
    });

    const timeFormatted = dueAt.toLocaleString('en-IN', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'CREATE_REMINDER',
      description: `Scheduled reminder "${title}" for ${timeFormatted}`,
      entityType: 'reminder',
      entityId: reminder._id.toString(),
      status: 'success',
      metadata: { title, dueAt },
    });

    return {
      id: reminder._id.toString(),
      type: 'CREATE_REMINDER',
      success: true,
      status: 'SUCCESS',
      message: `Reminder set: "${title}" for ${timeFormatted}. An automated email alert will be sent at that time.`,
      data: reminder,
    };
  }

  private static async updateReminder(payload: any, userId?: string, timezone: string = 'Asia/Kolkata'): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: IReminder | null = null;
    if (payload.reminderId) {
      target = await Reminder.findOne({ _id: payload.reminderId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Reminder.findOne({
        ...baseFilter,
        title: { $regex: new RegExp(payload.targetSearch, 'i') },
      }).sort({ dueAt: 1 });
    }

    // Fallback: pick the closest upcoming scheduled reminder
    if (!target) {
      target = await Reminder.findOne({ ...baseFilter, status: 'scheduled' }).sort({ dueAt: 1 });
    }

    if (!target) {
      return {
        type: 'UPDATE_REMINDER',
        success: false,
        status: 'FAILED',
        message: 'Could not find any scheduled reminder to change.',
      };
    }

    if (payload.newDueAt || payload.dueAt) {
      target.dueAt = new Date(payload.newDueAt || payload.dueAt);
      target.notificationSent = false;
      target.status = 'scheduled';
      target.emailStatus = 'pending';
    }

    if (payload.newTitle || payload.title) {
      target.title = (payload.newTitle || payload.title).trim();
    }

    if (payload.description !== undefined) {
      target.description = payload.description.trim();
    }

    await target.save();

    const timeFormatted = new Date(target.dueAt).toLocaleString('en-IN', {
      timeZone: timezone,
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'UPDATE_REMINDER',
      description: `Updated reminder "${target.title}" to ${timeFormatted}`,
      entityType: 'reminder',
      entityId: target._id.toString(),
      status: 'success',
      metadata: { title: target.title, dueAt: target.dueAt },
    });

    return {
      id: target._id.toString(),
      type: 'UPDATE_REMINDER',
      success: true,
      status: 'SUCCESS',
      message: `Updated reminder "${target.title}" to ${timeFormatted}.`,
      data: target,
    };
  }

  private static async deleteReminder(payload: any, userId?: string, confirmed?: boolean, timezone: string = 'Asia/Kolkata'): Promise<ActionResult> {
    const baseFilter: any = {};
    if (userId) baseFilter.userId = new Types.ObjectId(userId);

    let target: IReminder | null = null;

    if (payload.reminderId) {
      target = await Reminder.findOne({ _id: payload.reminderId, ...baseFilter });
    } else if (payload.targetSearch) {
      target = await Reminder.findOne({
        ...baseFilter,
        title: { $regex: new RegExp(payload.targetSearch, 'i') },
      }).sort({ dueAt: 1 });
    }

    if (!target) {
      return {
        type: 'DELETE_REMINDER',
        success: false,
        status: 'FAILED',
        message: `Could not find a reminder matching "${payload.targetSearch || 'the search'}".`,
      };
    }

    if (!confirmed) {
      const timeFormatted = new Date(target.dueAt).toLocaleString('en-IN', {
        timeZone: timezone,
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      return {
        id: target._id.toString(),
        type: 'DELETE_REMINDER',
        success: false,
        status: 'AWAITING_CONFIRMATION',
        requiresConfirmation: true,
        message: `Are you sure you want to delete the reminder "${target.title}" scheduled for ${timeFormatted}?`,
        confirmationDetails: {
          entityType: 'reminder',
          entityId: target._id.toString(),
          title: `Delete Reminder: ${target.title}`,
          message: `Confirm deleting reminder scheduled for ${timeFormatted}.`,
        },
      };
    }

    await Reminder.findByIdAndDelete(target._id);

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'DELETE_REMINDER',
      description: `Deleted reminder "${target.title}"`,
      entityType: 'reminder',
      entityId: target._id.toString(),
      status: 'success',
    });

    return {
      id: target._id.toString(),
      type: 'DELETE_REMINDER',
      success: true,
      status: 'SUCCESS',
      message: `Deleted reminder "${target.title}".`,
      data: { id: target._id },
    };
  }

  // --- QUERY HANDLERS (Real MongoDB Aggregation) ---
  private static async queryExpenses(payload: any, userId?: string): Promise<ActionResult> {
    const period = payload.period || 'this_month';
    const now = new Date();
    let dateFilter: any = {};
    let periodLabel = 'this month';

    if (period === 'today') {
      dateFilter = { $gte: startOfDay(now), $lte: endOfDay(now) };
      periodLabel = 'today';
    } else if (period === 'this_week') {
      dateFilter = { $gte: startOfWeek(now, { weekStartsOn: 1 }), $lte: endOfWeek(now, { weekStartsOn: 1 }) };
      periodLabel = 'this week';
    } else if (period === 'this_month') {
      dateFilter = { $gte: startOfMonth(now), $lte: endOfMonth(now) };
      periodLabel = 'this month';
    }

    const matchStage: any = {};
    if (userId) {
      matchStage.userId = new Types.ObjectId(userId);
    }
    if (Object.keys(dateFilter).length > 0) {
      matchStage.date = dateFilter;
    }
    if (payload.category) {
      matchStage.category = { $regex: new RegExp(payload.category, 'i') };
      periodLabel += ` on ${payload.category}`;
    }

    const aggregateResult = await Expense.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const total = aggregateResult[0]?.total || 0;
    const count = aggregateResult[0]?.count || 0;

    let message = '';
    if (count === 0) {
      message = `You haven't recorded any expenses ${periodLabel}.`;
    } else {
      message = `You have spent ₹${total.toLocaleString('en-IN')} across ${count} expense${count > 1 ? 's' : ''} ${periodLabel}.`;
    }

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'QUERY_EXPENSES',
      description: `Queried expenses for ${periodLabel}: ₹${total.toLocaleString('en-IN')}`,
      entityType: 'query',
      status: 'success',
      metadata: { total, count, period, category: payload.category },
    });

    return {
      type: 'QUERY_EXPENSES',
      success: true,
      status: 'SUCCESS',
      message,
      data: { total, count, period, category: payload.category },
    };
  }

  private static async queryTasks(payload: any, userId?: string): Promise<ActionResult> {
    const filter: any = {};
    if (userId) filter.userId = new Types.ObjectId(userId);

    const pendingCount = await Task.countDocuments({ ...filter, status: { $ne: 'completed' } });
    const completedCount = await Task.countDocuments({ ...filter, status: 'completed' });
    const upcomingTasks = await Task.find({ ...filter, status: { $ne: 'completed' } })
      .sort({ dueDate: 1 })
      .limit(3);

    let message = `You have ${pendingCount} pending task${pendingCount === 1 ? '' : 's'} and ${completedCount} completed.`;
    if (upcomingTasks.length > 0) {
      message += ` Your top task is "${upcomingTasks[0].title}".`;
    }

    await logActivity({
      userId: userId ? new Types.ObjectId(userId) : undefined,
      actionType: 'QUERY_TASKS',
      description: `Queried tasks: ${pendingCount} pending, ${completedCount} completed`,
      entityType: 'query',
      status: 'success',
      metadata: { pendingCount, completedCount },
    });

    return {
      type: 'QUERY_TASKS',
      success: true,
      status: 'SUCCESS',
      message,
      data: { pendingCount, completedCount, upcomingTasks },
    };
  }

  private static async querySummary(userId?: string): Promise<ActionResult> {
    const now = new Date();
    const filter: any = {};
    const matchStage: any = { date: { $gte: startOfMonth(now), $lte: endOfMonth(now) } };

    if (userId) {
      filter.userId = new Types.ObjectId(userId);
      matchStage.userId = new Types.ObjectId(userId);
    }

    const monthExpenses = await Expense.aggregate([
      { $match: matchStage },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);
    const totalSpent = monthExpenses[0]?.total || 0;
    const pendingTasks = await Task.countDocuments({ ...filter, status: { $ne: 'completed' } });
    const upcomingReminders = await Reminder.countDocuments({
      ...filter,
      status: 'scheduled',
      dueAt: { $gte: now },
    });

    const message = `Here is your summary: You have spent ₹${totalSpent.toLocaleString('en-IN')} this month, with ${pendingTasks} pending task${pendingTasks === 1 ? '' : 's'} and ${upcomingReminders} upcoming reminder${upcomingReminders === 1 ? '' : 's'}.`;

    return {
      type: 'QUERY_SUMMARY',
      success: true,
      status: 'SUCCESS',
      message,
      data: { totalSpent, pendingTasks, upcomingReminders },
    };
  }
}
