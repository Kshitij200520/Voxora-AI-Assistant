import { api } from './api';
import { User } from '../types';

export const userService = {
  async getProfile(): Promise<{ success: boolean; data: User }> {
    return api.get('/user/profile');
  },

  async updateProfile(data: {
    fullName?: string;
    timezone?: string;
    profileImage?: string;
  }): Promise<{ success: boolean; message: string; data: User }> {
    return api.put('/user/profile', data);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    return api.put('/user/change-password', data);
  },

  async deleteAccount(password: string): Promise<{ success: boolean; message: string }> {
    return api.delete('/user/account', { password });
  },
};

