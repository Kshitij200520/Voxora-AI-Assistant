import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../models/Expense';

export const CreateExpenseSchema = z.object({
  amount: z.number().positive({ message: 'Amount must be a positive number' }),
  currency: z.string().default('INR'),
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().min(1, { message: 'Description is required' }).max(200),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

