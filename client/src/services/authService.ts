import { api } from './api';
import { User, AuthResponse } from '../types';

export const authService = {
  async register(data: {
    fullName: string;
    email: string;
    password: string;
    timezone?: string;
  }): Promise<{ success: boolean; message: string; user?: User; token?: string }> {
    return api.post('/auth/register', data);
  },

  async login(data: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<{ success: boolean; message: string; user: User; token: string }> {
    return api.post('/auth/login', data);
  },

  async logout(): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/logout');
  },

  async getMe(): Promise<{ success: boolean; user: User }> {
    return api.get('/auth/me');
  },

  async verifyEmail(token: string): Promise<{ success: boolean; message: string; user: User }> {
    return api.post('/auth/verify-email', { token });
  },

  async resendVerification(): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/resend-verification');
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/forgot-password', { email });
  },

  async resetPassword(data: {
    token: string;
    password: string;
    confirmPassword?: string;
  }): Promise<{ success: boolean; message: string }> {
    return api.post('/auth/reset-password', data);
  },
};

