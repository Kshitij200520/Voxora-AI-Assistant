import { api } from './api';
import { UserNotificationSettings, NotificationHistoryItem } from '../types';

export const notificationService = {
  // --- Browser Web Notifications API ---
  getPermission(): NotificationPermission {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'denied';
  },

  async requestPermission(): Promise<NotificationPermission> {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        return permission;
      } catch {
        return 'denied';
      }
    }
    return 'denied';
  },

  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        return new Notification(title, {
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          ...options,
        });
      } catch {
        return null;
      }
    }
    return null;
  },

  // --- Backend SaaS Email Notification APIs ---
  async getSettings(): Promise<{
    success: boolean;
    data: {
      settings: UserNotificationSettings;
      user: {
        email: string;
        isEmailVerified: boolean;
        fullName: string;
      };
    };
  }> {
    return api.get('/notifications/settings');
  },

  async updateSettings(
    data: Partial<UserNotificationSettings>
  ): Promise<{ success: boolean; message: string; data: UserNotificationSettings }> {
    return api.put('/notifications/settings', data);
  },

  async sendTestNotification(): Promise<{ success: boolean; message: string }> {
    return api.post('/notifications/test');
  },

  async getHistory(): Promise<{ success: boolean; data: NotificationHistoryItem[] }> {
    return api.get('/notifications/history');
  },
};
