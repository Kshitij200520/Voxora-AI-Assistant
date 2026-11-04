import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { StatCard } from '../components/common/StatCard';
import { ExpenseChart } from '../components/expenses/ExpenseChart';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { TaskFormModal } from '../components/tasks/TaskFormModal';
import { ReminderFormModal } from '../components/reminders/ReminderFormModal';
import { expenseService } from '../services/expenseService';
import { taskService } from '../services/taskService';
import { reminderService } from '../services/reminderService';
import { useVoice } from '../contexts/VoiceContext';
import {
  IndianRupee,
  Calendar,
  CheckSquare,
  Bell,
  Plus,
  Mic,
  TrendingUp,
  Receipt,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);

  const { startVoiceInput } = useVoice();

  const fetchDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await api.get<{ success: boolean; data: DashboardSummary }>('/dashboard');
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch dashboard summary:', err);
      setError(err.message || 'Unable to connect to dashboard API');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();

    // Listen to voice assistant execution event
    const handleRefresh = () => fetchDashboardData();
    window.addEventListener('voxora:refresh', handleRefresh);
    return () => window.removeEventListener('voxora:refresh', handleRefresh);
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn">
      {/* Quick Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-900/40 via-purple-900/20 to-transparent border border-indigo-500/20 rounded-2xl p-4 sm:p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Voice AI Hackathon MVP
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            Speak. Understand. Act.
          </h2>
          <p className="text-xs text-slate-300 max-w-xl mt-1 leading-relaxed">
            VOXORA AI listens to your natural voice, extracts multi-intent actions via Groq LLM, executes real CRUD in MongoDB Atlas, and responds aloud.
          </p>
        </div>

        <div className="flex items-center gap-2.5 relative z-10 self-start sm:self-auto">
          <button
            type="button"
            onClick={startVoiceInput}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-glow-primary transition-all active:scale-95"
          >
            <Mic className="w-4 h-4" /> Speak Command
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        <StatCard
          title="Total Spent (All-Time)"
          value={`₹${(summary?.totalExpenses || 0).toLocaleString('en-IN')}`}
          subtitle={`${summary?.totalExpensesCount || 0} expenses recorded`}
          icon={IndianRupee}
          iconBg="bg-emerald-500/10 border-emerald-500/20"
          iconColor="text-emerald-400"
        />

        <StatCard
          title="Current Month Expenses"
          value={`₹${(summary?.currentMonthExpenses || 0).toLocaleString('en-IN')}`}
          subtitle={`${summary?.currentMonthExpensesCount || 0} this month`}
          icon={Calendar}
          iconBg="bg-blue-500/10 border-blue-500/20"
          iconColor="text-blue-400"
          trend={{ value: 'Real-time', isPositive: true }}
        />

        <StatCard
          title="Pending Tasks"
          value={summary?.pendingTasks ?? 0}
          subtitle={`${summary?.completedTasks ?? 0} completed`}
          icon={CheckSquare}
          iconBg="bg-amber-500/10 border-amber-500/20"
          iconColor="text-amber-400"
        />

        <StatCard
          title="Upcoming Reminders"
          value={summary?.upcomingReminders ?? 0}
          subtitle="Scheduled alerts"
          icon={Bell}
          iconBg="bg-purple-500/10 border-purple-500/20"
          iconColor="text-purple-400"
        />
      </div>

      {/* Quick Action Floating Bar */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="text-xs font-semibold text-slate-400 mr-2">Quick Manual Add:</span>
        <button
          onClick={() => setIsExpenseModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" /> Add Expense
        </button>
        <button
          onClick={() => setIsTaskModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-blue-400" /> New Task
        </button>
        <button
          onClick={() => setIsReminderModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
        >
          <Plus className="w-3.5 h-3.5 text-purple-400" /> Set Reminder
        </button>
      </div>

      {/* Analytics Charts */}
      {summary && (
        <ExpenseChart
          categoryData={summary.categoryBreakdown || []}
          monthlyData={summary.monthlyTrend || []}
        />
      )}

      {/* Recent Activity and Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 min-w-0">
        {/* Recent Transactions */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 pr-2">
              <h3 className="text-sm font-semibold text-slate-100 truncate">Recent Expenses</h3>
              <p className="text-xs text-slate-400 truncate">Latest financial records in MongoDB</p>
            </div>
            <Link
              to="/expenses"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 shrink-0"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(!summary?.recentExpenses || summary.recentExpenses.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No expenses recorded yet. Speak a command or click "Add Expense".
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {summary.recentExpenses.map((expense) => (
                <div key={expense._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate">{expense.description}</p>
                      <p className="text-[11px] text-slate-400 truncate">
                        {expense.category} • {new Date(expense.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-slate-100 shrink-0">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity Log */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-6 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div className="min-w-0 pr-2">
              <h3 className="text-sm font-semibold text-slate-100 truncate">Live Activity Audit</h3>
              <p className="text-xs text-slate-400 truncate">Actions executed by user or Groq AI</p>
            </div>
            <Link
              to="/activity"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 shrink-0"
            >
              Audit log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {(!summary?.recentActivities || summary.recentActivities.length === 0) ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No recent actions logged. Use voice commands to populate activity.
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {summary.recentActivities.map((act) => (
                <div key={act._id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{act.description}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {new Date(act.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {act.actionType}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                      act.status === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}
                  >
                    {act.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Manual Modals */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        onSubmit={async (data) => {
          await expenseService.create(data);
          fetchDashboardData();
        }}
      />

      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSubmit={async (data) => {
          await taskService.create(data);
          fetchDashboardData();
        }}
      />

      <ReminderFormModal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        onSubmit={async (data) => {
          await reminderService.create(data);
          fetchDashboardData();
        }}
      />
    </div>
  );
};

