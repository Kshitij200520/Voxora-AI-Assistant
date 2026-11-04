import React, { useState } from 'react';
import { Task, TaskPriority } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CheckCircle2, Circle, Calendar, Edit2, Trash2, AlertCircle } from 'lucide-react';

interface TaskCardProps {
  task: Task;
  onToggleComplete: (task: Task) => Promise<void>;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => Promise<void>;
}

const priorityBadges: Record<TaskPriority, { label: string; class: string }> = {
  high: { label: 'High Priority', class: 'text-rose-400 bg-rose-500/10 border-rose-500/20' },
  medium: { label: 'Medium', class: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  low: { label: 'Low', class: 'text-slate-400 bg-slate-500/10 border-slate-500/20' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const isCompleted = task.status === 'completed';

  const isOverdue =
    !isCompleted &&
    task.dueDate &&
    new Date(task.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

  const priorityConfig = priorityBadges[task.priority] || priorityBadges.medium;

  return (
    <>
      <div
        className={`bg-[#111827] border rounded-2xl p-3.5 sm:p-4 transition-all duration-200 group ${
          isCompleted
            ? 'border-white/5 opacity-65 bg-[#0e1422]'
            : 'border-white/10 hover:border-white/20 shadow-sm'
        }`}
      >
        <div className="flex items-start gap-3 sm:gap-3.5">
          {/* Completion Checkbox */}
          <button
            type="button"
            onClick={() => onToggleComplete(task)}
            className="p-1 -ml-1 mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            aria-label={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : (
              <Circle className="w-5 h-5 text-slate-500 group-hover:border-indigo-400" />
            )}
          </button>

          {/* Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-semibold break-words ${
                  isCompleted ? 'line-through text-slate-400' : 'text-slate-100'
                }`}
              >
                {task.title}
              </h4>
              <span
                className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${priorityConfig.class}`}
              >
                {priorityConfig.label}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2 break-words">{task.description}</p>
            )}

            {/* Due date tag */}
            {task.dueDate && (
              <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-lg border ${
                    isOverdue
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {isOverdue ? (
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                  )}
                  <span>
                    {isOverdue ? 'Overdue: ' : 'Due: '}
                    {new Date(task.dueDate).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </span>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
              title="Edit Task"
              aria-label="Edit Task"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Delete Task"
              aria-label="Delete Task"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => onDelete(task._id)}
        title="Delete Task"
        message={`Are you sure you want to delete task "${task.title}"? This cannot be undone.`}
        confirmText="Delete Task"
      />
    </>
  );
};

