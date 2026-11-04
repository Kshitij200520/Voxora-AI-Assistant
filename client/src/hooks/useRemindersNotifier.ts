import { useEffect, useRef } from 'react';
import { reminderService } from '../services/reminderService';
import { notificationService } from '../services/notificationService';
import { useSettings } from '../contexts/SettingsContext';

export function useRemindersNotifier() {
  const { notificationPermission } = useSettings();
  const processedIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (notificationPermission !== 'granted') return;

    const checkDueReminders = async () => {
      try {
        const response = await reminderService.getAll({ status: 'scheduled' });
        if (!response.success || !Array.isArray(response.data)) return;

        const now = new Date();

        for (const reminder of response.data) {
          const dueTime = new Date(reminder.dueAt);

          // If due time is now or within the past 10 minutes, and not already delivered/processed
          if (dueTime <= now && !reminder.notificationSent && !processedIdsRef.current.has(reminder._id)) {
            processedIdsRef.current.add(reminder._id);

            // Trigger notification
            notificationService.showNotification(`⏰ Reminder: ${reminder.title}`, {
              body: reminder.description || `Scheduled for ${dueTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
              tag: `reminder-${reminder._id}`,
            });

            // Mark delivered on backend
            await reminderService.update(reminder._id, {
              status: 'delivered',
              notificationSent: true,
            });
          }
        }
      } catch (err) {
        // Silent catch for background polling
      }
    };

    checkDueReminders();
    const interval = setInterval(checkDueReminders, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [notificationPermission]);
}

