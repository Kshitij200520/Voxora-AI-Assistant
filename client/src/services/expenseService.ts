import { api } from './api';
import { Expense, ExpenseCategory } from '../types';

export interface ExpenseQueryParams {
  category?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export const expenseService = {
  getAll: async (params: ExpenseQueryParams = {}) => {
    const searchParams = new URLSearchParams();
    if (params.category && params.category !== 'All') searchParams.append('category', params.category);
    if (params.search) searchParams.append('search', params.search);
    if (params.startDate) searchParams.append('startDate', params.startDate);
    if (params.endDate) searchParams.append('endDate', params.endDate);
    if (params.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params.page) searchParams.append('page', String(params.page));
    if (params.limit) searchParams.append('limit', String(params.limit));

    const qs = searchParams.toString();
    const endpoint = `/expenses${qs ? `?${qs}` : ''}`;
    return api.get<{ success: boolean; data: Expense[]; pagination: any }>(endpoint);
  },

  getById: async (id: string) => {
    return api.get<{ success: boolean; data: Expense }>(`/expenses/${id}`);
  },

  create: async (data: {
    amount: number;
    currency?: string;
    category: ExpenseCategory;
    description: string;
    date?: string;
  }) => {
    return api.post<{ success: boolean; data: Expense }>('/expenses', data);
  },

  update: async (
    id: string,
    data: Partial<{
      amount: number;
      category: ExpenseCategory;
      description: string;
      date: string;
    }>
  ) => {
    return api.put<{ success: boolean; data: Expense }>(`/expenses/${id}`, data);
  },

  delete: async (id: string) => {
    return api.delete<{ success: boolean; data: { id: string } }>(`/expenses/${id}`);
  },

  exportToCSV: (expenses: Expense[]) => {
    if (!expenses.length) return;

    const headers = ['ID', 'Date', 'Description', 'Category', 'Amount', 'Currency'];
    const rows = expenses.map((exp) => [
      exp._id,
      new Date(exp.date).toLocaleDateString('en-IN'),
      `"${exp.description.replace(/"/g, '""')}"`,
      exp.category,
      exp.amount,
      exp.currency,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `voxora-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
};

