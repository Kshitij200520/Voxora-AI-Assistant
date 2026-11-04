import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../models/Expense';

export const ActionTypeEnum = z.enum([
  'CREATE_EXPENSE',
  'UPDATE_EXPENSE',
  'DELETE_EXPENSE',
  'CREATE_TASK',
  'UPDATE_TASK',
  'DELETE_TASK',
  'COMPLETE_TASK',
  'CREATE_REMINDER',
  'UPDATE_REMINDER',
  'DELETE_REMINDER',
  'QUERY_EXPENSES',
  'QUERY_TASKS',
  'QUERY_SUMMARY',
  'CHAT',
  'UNKNOWN',
]);

export type ActionType = z.infer<typeof ActionTypeEnum>;

export const CreateExpensePayloadSchema = z.object({
  amount: z.number().positive({ message: 'Amount must be greater than zero' }),
  currency: z.string().default('INR'),
  category: z.enum(EXPENSE_CATEGORIES).default('Other'),
  description: z.string().min(1, { message: 'Description cannot be empty' }),
  date: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
});

export const DeleteExpensePayloadSchema = z.object({
  targetSearch: z.string().optional(),
  amount: z.number().positive().optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  expenseId: z.string().optional(),
});

export const CreateTaskPayloadSchema = z.object({
  title: z.string().min(1, { message: 'Task title cannot be empty' }),
  description: z.string().optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().optional().nullable(),
});

export const CompleteTaskPayloadSchema = z.object({
  targetSearch: z.string().optional(),
  taskId: z.string().optional(),
});

export const DeleteTaskPayloadSchema = z.object({
  targetSearch: z.string().optional(),
  taskId: z.string().optional(),
});

export const CreateReminderPayloadSchema = z.object({
  title: z.string().min(1, { message: 'Reminder title cannot be empty' }),
  description: z.string().optional().default(''),
  dueAt: z.string().min(1, { message: 'dueAt is required' }),
});

export const DeleteReminderPayloadSchema = z.object({
  targetSearch: z.string().optional(),
  reminderId: z.string().optional(),
});

export const QueryPayloadSchema = z.object({
  period: z.enum(['today', 'this_week', 'this_month', 'all_time', 'custom']).optional(),
  category: z.string().optional(),
  status: z.string().optional(),
  question: z.string().optional(),
});

export const ActionItemSchema = z.object({
  id: z.string().optional(),
  type: ActionTypeEnum,
  requiresConfirmation: z.boolean().default(false),
  confirmationMessage: z.string().optional(),
  payload: z.record(z.any()).default({}),
});

export const GroqInterpretationResponseSchema = z.object({
  actions: z.array(ActionItemSchema),
  response: z.string(),
  detectedLanguage: z.enum(['en', 'hi', 'hinglish']).default('en'),
});

export type ActionItem = z.infer<typeof ActionItemSchema>;
export type GroqInterpretationResponse = z.infer<typeof GroqInterpretationResponseSchema>;

