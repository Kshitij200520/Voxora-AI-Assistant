import { api } from './api';
import { Reminder, ReminderStatus } from '../types';

export const reminderService = {
  getAll: async (params: { status?: string } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.status && params.status !== 'all') searchParams.append('status', params.status);

    const qs = searchParams.toString();
    return api.get<{ success: boolean; data: Reminder[]; pagination: any }>(
      `/reminders${qs ? `?${qs}` : ''}`
    );
  },

  create: async (data: {
    title: string;
    description?: string;
    dueAt: string;
    status?: ReminderStatus;
  }) => {
    return api.post<{ success: boolean; data: Reminder }>('/reminders', data);
  },

  update: async (
    id: string,
    data: Partial<{
      title: string;
      description: string;
      dueAt: string;
      status: ReminderStatus;
      notificationSent: boolean;
    }>
  ) => {
    return api.put<{ success: boolean; data: Reminder }>(`/reminders/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete<{ success: boolean; data: { id: string } }>(`/reminders/${id}`);
  },
};

