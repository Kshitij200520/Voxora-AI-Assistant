import { z } from 'zod';

export const CreateReminderSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().max(1000).optional().default(''),
  dueAt: z.string().min(1, { message: 'Due date and time is required' }),
  status: z.enum(['scheduled', 'completed', 'delivered']).default('scheduled'),
});

export const UpdateReminderSchema = CreateReminderSchema.partial();

