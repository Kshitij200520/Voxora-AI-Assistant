import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Expense } from '../models/Expense';
import { Task } from '../models/Task';
import { Reminder } from '../models/Reminder';
import { ActivityLog } from '../models/ActivityLog';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';

export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = new Types.ObjectId(req.user!.id);
    const now = new Date();
    const curMonthStart = startOfMonth(now);
    const curMonthEnd = endOfMonth(now);

    const [
      totalExpensesAgg,
      curMonthExpensesAgg,
      categoryExpensesAgg,
      pendingTasksCount,
      completedTasksCount,
      upcomingRemindersCount,
      recentExpenses,
      recentActivities,
    ] = await Promise.all([
      // Total expenses all-time for this user
      Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Current month expenses for this user
      Expense.aggregate([
        { $match: { userId, date: { $gte: curMonthStart, $lte: curMonthEnd } } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      // Category-wise spending for this user
      Expense.aggregate([
        { $match: { userId } },
        { $group: { _id: '$category', total: { $sum: '$amount' }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      // Pending tasks
      Task.countDocuments({ userId, status: { $ne: 'completed' } }),
      // Completed tasks
      Task.countDocuments({ userId, status: 'completed' }),
      // Upcoming reminders
      Reminder.countDocuments({ userId, status: 'scheduled', dueAt: { $gte: now } }),
      // Recent expenses
      Expense.find({ userId }).sort({ date: -1 }).limit(5),
      // Recent activities
      ActivityLog.find({ userId }).sort({ createdAt: -1 }).limit(6),
    ]);

    // Monthly trend for the last 6 months
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const monthlyTrendAgg = await Expense.aggregate([
      { $match: { userId, date: { $gte: sixMonthsAgo, $lte: now } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = monthlyTrendAgg.map((m) => ({
      name: `${monthNames[m._id.month - 1]} ${m._id.year}`,
      total: m.total,
      count: m.count,
    }));

    res.json({
      success: true,
      data: {
        totalExpenses: totalExpensesAgg[0]?.total || 0,
        totalExpensesCount: totalExpensesAgg[0]?.count || 0,
        currentMonthExpenses: curMonthExpensesAgg[0]?.total || 0,
        currentMonthExpensesCount: curMonthExpensesAgg[0]?.count || 0,
        pendingTasks: pendingTasksCount,
        completedTasks: completedTasksCount,
        upcomingReminders: upcomingRemindersCount,
        categoryBreakdown: categoryExpensesAgg.map((c) => ({
          category: c._id,
          total: c.total,
          count: c.count,
        })),
        monthlyTrend,
        recentExpenses,
        recentActivities,
      },
    });
  } catch (error) {
    next(error);
  }
};
