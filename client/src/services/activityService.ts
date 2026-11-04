import { api } from './api';
import { ActivityLog } from '../types';

export const activityService = {
  getAll: async (params: { entityType?: string; limit?: number; page?: number } = {}) => {
    const searchParams = new URLSearchParams();
    if (params.entityType && params.entityType !== 'all') {
      searchParams.append('entityType', params.entityType);
    }
    if (params.limit) searchParams.append('limit', String(params.limit));
    if (params.page) searchParams.append('page', String(params.page));

    const qs = searchParams.toString();
    return api.get<{ success: boolean; data: ActivityLog[]; pagination: any }>(
      `/activity${qs ? `?${qs}` : ''}`
    );
  },
};

