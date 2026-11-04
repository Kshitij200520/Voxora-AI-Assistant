import React, { useState } from 'react';
import { Reminder } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Bell, Clock, CheckCircle2, Edit2, Trash2 } from 'lucide-react';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => Promise<void>;
  onMarkComplete: (reminder: Reminder) => Promise<void>;
}

export const ReminderCard: React.FC<ReminderCardProps> = ({
  reminder,
  onEdit,
  onDelete,
  onMarkComplete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isPast = new Date(reminder.dueAt).getTime() < Date.now();
  const isDone = reminder.status === 'completed';

  const getStatusBadge = () => {
    if (isDone) {
      return (
        <span className="text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
          Completed
        </span>
      );
    }
    if (reminder.status === 'delivered') {
      return (
        <span className="text-[11px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 rounded-full font-medium">
          Alert Delivered
        </span>
      );
    }
    if (isPast) {
      return (
        <span className="text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-medium">
          Due Now
        </span>
      );
    }
    return (
      <span className="text-[11px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium">
        Scheduled
      </span>
    );
  };

  return (
    <>
      <div
        className={`bg-[#111827] border rounded-2xl p-5 transition-all duration-200 group ${
          isDone
            ? 'border-white/5 opacity-60 bg-[#0e1422]'
            : 'border-white/10 hover:border-white/20 shadow-sm'
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-purple-500/10 border-purple-500/20 text-purple-400'
              }`}
            >
              <Bell className="w-5 h-5" />
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className={`text-sm font-semibold ${
                    isDone ? 'line-through text-slate-400' : 'text-slate-100'
                  }`}
                >
                  {reminder.title}
                </h4>
                {getStatusBadge()}
              </div>

              {reminder.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {reminder.description}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2 text-xs text-purple-300 bg-purple-950/30 border border-purple-500/20 px-3 py-1 rounded-lg w-fit">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {new Date(reminder.dueAt).toLocaleString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
            {!isDone && (
              <button
                type="button"
                onClick={() => onMarkComplete(reminder)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="Mark completed"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
            <button
              type="button"
              onClick={() => onEdit(reminder)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title="Edit Reminder"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Reminder"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(reminder._id)}
        title="Delete Reminder"
        message={`Are you sure you want to delete the reminder "${reminder.title}"?`}
        confirmText="Delete Reminder"
      />
    </>
  );
};

