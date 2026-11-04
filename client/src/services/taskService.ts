import { api } from './api';
import { Task, TaskPriority, TaskStatus } from '../types';

export const taskService = {
  getAll: async (params: { status?: string; priority?: string; search?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);
    if (params.priority && params.priority !== 'all') searchParams.append('priority', params.priority);
    if (params.search) searchParams.append('search', params.search);

    const qs = searchParams.toString();
    return api.get<{ success: boolean; data: Task[]; pagination: any }>(
      `/tasks${qs ? `?${qs}` : ''}`
    );
  },

  create: async (data: {
    title: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    dueDate?: string | null;
  }) => {
    return api.post<{ success: boolean; data: Task }>('/tasks', data);
  },

  update: async (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      priority: TaskPriority;
      status: TaskStatus;
      dueDate: string | null;
    }>
  ) => {
    return api.put<{ success: boolean; data: Task }>(`/tasks/${id}`, data);
  },

  toggleComplete: async (task: Task) => {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed';
    return api.put<{ success: boolean; data: Task }>(`/tasks/${task._id}`, { status: newStatus });
  },

  delete: async (id: string) => {
    return api.delete<{ success: boolean; data: { id: string } }>(`/tasks/${id}`);
  },
};

