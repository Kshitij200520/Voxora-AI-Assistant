import { Request, Response, NextFunction } from 'express';
import { Expense } from '../models/Expense';
import { logActivity } from '../services/activity.service';

export const getExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { category, search, startDate, endDate, sortBy = 'date', sortOrder = 'desc', limit = 50, page = 1 } = req.query;

    const filter: any = { userId };

    if (category && category !== 'All') {
      filter.category = category;
    }

    if (search) {
      filter.description = { $regex: new RegExp(String(search), 'i') };
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(String(startDate));
      if (endDate) {
        const end = new Date(String(endDate));
        end.setHours(23, 59, 59, 999);
        filter.date.$lte = end;
      }
    }

    const sortOptions: any = {};
    sortOptions[String(sortBy)] = sortOrder === 'asc' ? 1 : -1;

    const pageNum = Math.max(1, parseInt(String(page), 10));
    const limitNum = Math.max(1, parseInt(String(limit), 10));
    const skip = (pageNum - 1) * limitNum;

    const [expenses, totalCount] = await Promise.all([
      Expense.find(filter).sort(sortOptions).skip(skip).limit(limitNum),
      Expense.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: expenses,
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

export const getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user!.id });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }
    res.json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { amount, currency = 'INR', category, description, date } = req.body;
    const userId = req.user!.id;

    const expense = await Expense.create({
      userId,
      amount,
      currency,
      category,
      description,
      date: date ? new Date(date) : new Date(),
    });

    await logActivity({
      userId: req.user!.id,
      actionType: 'CREATE_EXPENSE',
      description: `Added expense ₹${amount} for ${description}`,
      entityType: 'expense',
      entityId: expense._id.toString(),
      status: 'success',
      metadata: { amount, category, description },
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const updated = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user!.id },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updated) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    await logActivity({
      userId: req.user!.id,
      actionType: 'UPDATE_EXPENSE',
      description: `Updated expense: ${updated.description}`,
      entityType: 'expense',
      entityId: updated._id.toString(),
      status: 'success',
      metadata: req.body,
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    if (!expense) {
      return res.status(404).json({ success: false, error: 'Expense not found' });
    }

    await logActivity({
      userId: req.user!.id,
      actionType: 'DELETE_EXPENSE',
      description: `Deleted expense ₹${expense.amount} (${expense.description})`,
      entityType: 'expense',
      entityId: expense._id.toString(),
      status: 'success',
    });

    res.json({ success: true, message: 'Expense deleted successfully', data: { id: expense._id } });
  } catch (error) {
    next(error);
  }
};
