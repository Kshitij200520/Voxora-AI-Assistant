import React from 'react';
import { ActionItem, ActionResult } from '../../types';
import {
  Receipt,
  CheckSquare,
  Bell,
  Trash2,
  CheckCircle,
  HelpCircle,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

interface ActionPreviewCardProps {
  action: ActionItem;
  result?: ActionResult;
}

export const ActionPreviewCard: React.FC<ActionPreviewCardProps> = ({ action, result }) => {
  const getActionDetails = () => {
    switch (action.type) {
      case 'CREATE_EXPENSE':
        return {
          title: 'Create Expense',
          icon: Receipt,
          iconColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          summary: `₹${action.payload.amount} on ${action.payload.description || 'Expense'} (${action.payload.category || 'Other'})`,
        };
      case 'DELETE_EXPENSE':
        return {
          title: 'Delete Expense',
          icon: Trash2,
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          summary: `Target: "${action.payload.targetSearch || 'Matching expense'}"`,
        };
      case 'CREATE_TASK':
        return {
          title: 'Create Task',
          icon: CheckSquare,
          iconColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          summary: `"${action.payload.title}" (${action.payload.priority || 'medium'} priority)${
            action.payload.dueDate ? ` due ${new Date(action.payload.dueDate).toLocaleDateString()}` : ''
          }`,
        };
      case 'COMPLETE_TASK':
        return {
          title: 'Complete Task',
          icon: CheckCircle,
          iconColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          summary: `Mark task "${action.payload.targetSearch || 'target'}" as completed`,
        };
      case 'DELETE_TASK':
        return {
          title: 'Delete Task',
          icon: Trash2,
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          summary: `Target: "${action.payload.targetSearch || 'Matching task'}"`,
        };
      case 'CREATE_REMINDER':
        return {
          title: 'Schedule Reminder',
          icon: Bell,
          iconColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          summary: `"${action.payload.title}" at ${
            action.payload.dueAt ? new Date(action.payload.dueAt).toLocaleString('en-IN') : 'Scheduled time'
          }`,
        };
      case 'UPDATE_REMINDER':
        return {
          title: 'Update Reminder',
          icon: Bell,
          iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          summary: `Reschedule ${action.payload.targetSearch || 'reminder'} to ${
            action.payload.newDueAt ? new Date(action.payload.newDueAt).toLocaleString('en-IN') : 'new time'
          }`,
        };
      case 'UPDATE_TASK':
        return {
          title: 'Update Task',
          icon: CheckSquare,
          iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          summary: `Update task "${action.payload.targetSearch || 'task'}"`,
        };
      case 'UPDATE_EXPENSE':
        return {
          title: 'Update Expense',
          icon: Receipt,
          iconColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          summary: `Update ${action.payload.targetSearch || 'expense'} to ₹${action.payload.amount || ''}`,
        };
      case 'DELETE_REMINDER':
        return {
          title: 'Delete Reminder',
          icon: Trash2,
          iconColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          summary: `Target: "${action.payload.targetSearch || 'Matching reminder'}"`,
        };
      default:
        return {
          title: action.type,
          icon: HelpCircle,
          iconColor: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
          summary: JSON.stringify(action.payload),
        };
    }
  };

  const { title, icon: Icon, iconColor, summary } = getActionDetails();

  return (
    <div className="bg-[#151C2C] border border-white/10 rounded-xl p-3 flex items-start justify-between gap-3 shadow-sm hover:border-white/20 transition-all">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg border ${iconColor}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-200">{title}</span>
            {action.requiresConfirmation && !result?.success && (
              <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded font-medium">
                Needs Confirmation
              </span>
            )}
          </div>
          <p className="text-sm text-slate-300 mt-0.5 font-medium">{summary}</p>
          {result && (
            <p
              className={`text-xs mt-1 font-normal ${
                result.success ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {result.message}
            </p>
          )}
        </div>
      </div>

      <div>
        {result ? (
          result.success ? (
            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              <Check className="w-3 h-3" /> Saved
            </span>
          ) : result.status === 'AWAITING_CONFIRMATION' ? (
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> Pending
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full">
              <X className="w-3 h-3" /> Failed
            </span>
          )
        ) : (
          <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
            Ready
          </span>
        )}
      </div>
    </div>
  );
};

