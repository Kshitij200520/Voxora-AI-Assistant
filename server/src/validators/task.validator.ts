import { z } from 'zod';

export const CreateTaskSchema = z.object({
  title: z.string().min(1, { message: 'Title is required' }).max(200),
  description: z.string().max(1000).optional().default(''),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  dueDate: z.string().nullable().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial();

