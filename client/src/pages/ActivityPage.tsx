import React, { useState, useEffect, useCallback } from 'react';
import { ActivityLog } from '../types';
import { activityService } from '../services/activityService';
import { EmptyState } from '../components/common/EmptyState';
import {
  History,
  Receipt,
  CheckSquare,
  Bell,
  HelpCircle,
  Brain,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
} from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState('all');

  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await activityService.getAll({
        entityType: entityFilter !== 'all' ? entityFilter : undefined,
        limit: 100,
      });

      if (res.success && res.data) {
        setLogs(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch activity log');
    } finally {
      setIsLoading(false);
    }
  }, [entityFilter]);

  useEffect(() => {
    fetchLogs();

    const handleRefresh = () => fetchLogs();
    window.addEventListener('voxora:refresh', handleRefresh);
    return () => window.removeEventListener('voxora:refresh', handleRefresh);
  }, [fetchLogs]);

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'expense':
        return <Receipt className="w-4 h-4 text-emerald-400" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-400" />;
      case 'reminder':
        return <Bell className="w-4 h-4 text-purple-400" />;
      case 'query':
        return <Brain className="w-4 h-4 text-indigo-400" />;
      default:
        return <HelpCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Activity History</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Immutable audit trail of actions executed in MongoDB Atlas
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="bg-[#111827] border border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Activities</option>
            <option value="expense">Expenses Only</option>
            <option value="task">Tasks Only</option>
            <option value="reminder">Reminders Only</option>
            <option value="query">AI Queries Only</option>
          </select>
        </div>
      </div>

      {/* Timeline List */}
      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs">
          {error}
        </div>
      ) : logs.length === 0 && !isLoading ? (
        <EmptyState
          icon={History}
          title="No activity recorded"
          description="Actions performed by you or interpreted by the voice assistant will be listed here."
          voiceHint="I spent 500 rupees on travel"
        />
      ) : (
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-6">
          <div className="relative pl-5 sm:pl-6 space-y-5 sm:space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
            {logs.map((log) => {
              const isSuccess = log.status === 'success';
              return (
                <div key={log._id} className="relative group">
                  {/* Timeline bullet dot */}
                  <div
                    className={`absolute -left-[23px] sm:-left-[27px] top-1.5 w-4 h-4 rounded-full border-2 border-[#111827] flex items-center justify-center ${
                      isSuccess ? 'bg-indigo-500' : 'bg-rose-500'
                    }`}
                  />

                  <div className="bg-[#0B0F19] border border-white/5 rounded-xl p-3.5 sm:p-4 hover:border-white/10 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/5 mt-0.5 shrink-0">
                          {getEntityIcon(log.entityType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-semibold text-slate-200">
                              {log.actionType}
                            </span>
                            <span
                              className={`text-[10px] font-medium px-2 py-0.2 rounded-full border shrink-0 ${
                                isSuccess
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                              }`}
                            >
                              {log.status}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium break-words">
                            {log.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 shrink-0 pl-11 sm:pl-0">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

