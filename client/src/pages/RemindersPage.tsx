import React, { useState, useEffect, useCallback } from 'react';
import { Reminder, ReminderStatus } from '../types';
import { reminderService } from '../services/reminderService';
import { ReminderCard } from '../components/reminders/ReminderCard';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import { EmptyState } from '../components/common/EmptyState';
import { useVoice } from '../contexts/VoiceContext';
import { useSettings } from '../contexts/SettingsContext';
import { Bell, Plus, Mic, Info, CheckCircle2 } from 'lucide-react';

export const RemindersPage: React.FC = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  const { startVoiceInput } = useVoice();
  const { notificationPermission, requestNotificationPermission } = useSettings();

  const fetchReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await reminderService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
      });

      if (res.success && res.data) {
        setReminders(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch reminders');
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReminders();

    const handleRefresh = () => fetchReminders();
    window.addEventListener('voxora:refresh', handleRefresh);
    return () => window.removeEventListener('voxora:refresh', handleRefresh);
  }, [fetchReminders]);

  const handleCreateOrUpdate = async (data: any) => {
    if (editingReminder) {
      await reminderService.update(editingReminder._id, data);
    } else {
      await reminderService.create(data);
    }
    fetchReminders();
  };

  const handleMarkComplete = async (reminder: Reminder) => {
    await reminderService.update(reminder._id, { status: 'completed' });
    fetchReminders();
  };

  const handleDelete = async (id: string) => {
    await reminderService.delete(id);
    fetchReminders();
  };

  const upcomingCount = reminders.filter(
    (r) => r.status === 'scheduled' && new Date(r.dueAt).getTime() >= Date.now()
  ).length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Reminders</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Voice-scheduled reminders with automated browser alerts
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={startVoiceInput}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all"
          >
            <Mic className="w-3.5 h-3.5" /> Voice Reminder
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingReminder(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Set Reminder
          </button>
        </div>
      </div>

      {/* Notification Status Banner */}
      <div
        className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 text-xs ${
          notificationPermission === 'granted'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
        }`}
      >
        <div className="flex items-start gap-3 min-w-0">
          {notificationPermission === 'granted' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="min-w-0">
            <span className="font-semibold block truncate">
              {notificationPermission === 'granted'
                ? 'Browser Notifications Active'
                : 'Browser Notifications Disabled'}
            </span>
            <p className="mt-0.5 opacity-90 leading-relaxed">
              {notificationPermission === 'granted'
                ? 'You will receive native desktop notifications when scheduled alerts are due while the app is running.'
                : 'VOXORA AI uses the Web Notifications API. Please allow notification permissions so alerts can pop up on time.'}
            </p>
          </div>
        </div>

        {notificationPermission !== 'granted' && (
          <button
            type="button"
            onClick={requestNotificationPermission}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-500 text-slate-900 font-semibold text-xs shrink-0 hover:bg-amber-400 transition-colors text-center"
          >
            Enable Notifications
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-[#111827] p-1 rounded-xl border border-white/10 text-xs w-full sm:w-fit overflow-x-auto">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            statusFilter === 'all'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Reminders ({reminders.length})
        </button>
        <button
          onClick={() => setStatusFilter('scheduled')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            statusFilter === 'scheduled'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Scheduled ({upcomingCount})
        </button>
        <button
          onClick={() => setStatusFilter('completed')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
            statusFilter === 'completed'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Completed
        </button>
      </div>

      {/* Reminders List */}
      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs">
          {error}
        </div>
      ) : reminders.length === 0 && !isLoading ? (
        <EmptyState
          icon={Bell}
          title="No reminders scheduled"
          description="Never miss important events or deadlines. Try scheduling one with your voice."
          voiceHint="Remind me to submit my assignment tomorrow at 10 AM"
          actionText="Create Reminder"
          onAction={() => {
            setEditingReminder(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder._id}
              reminder={reminder}
              onEdit={(r) => {
                setEditingReminder(r);
                setIsFormOpen(true);
              }}
              onDelete={handleDelete}
              onMarkComplete={handleMarkComplete}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <ReminderFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingReminder(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingReminder}
      />
    </div>
  );
};

