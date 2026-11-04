import React, { useState, useEffect, useCallback } from 'react';
import { Expense, ExpenseCategory } from '../types';
import { expenseService } from '../services/expenseService';
import { ExpenseTable } from '../components/expenses/ExpenseTable';
import { ExpenseFormModal } from '../components/expenses/ExpenseFormModal';
import { EmptyState } from '../components/common/EmptyState';
import { useVoice } from '../contexts/VoiceContext';
import {
  Receipt,
  Plus,
  Mic,
  Download,
  Search,
  Filter,
  IndianRupee,
  ArrowUpDown,
} from 'lucide-react';

const CATEGORIES: ('All' | ExpenseCategory)[] = [
  'All',
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Health',
  'Bills',
  'Other',
];

export const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const { startVoiceInput } = useVoice();

  const fetchExpenses = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await expenseService.getAll({
        category: category !== 'All' ? category : undefined,
        search: search.trim() || undefined,
        sortBy,
        sortOrder,
        limit: 100,
      });

      if (res.success && res.data) {
        setExpenses(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
    }
  }, [category, search, sortBy, sortOrder]);

  useEffect(() => {
    fetchExpenses();

    const handleRefresh = () => fetchExpenses();
    window.addEventListener('voxora:refresh', handleRefresh);
    return () => window.removeEventListener('voxora:refresh', handleRefresh);
  }, [fetchExpenses]);

  const handleCreateOrUpdate = async (data: any) => {
    if (editingExpense) {
      await expenseService.update(editingExpense._id, data);
    } else {
      await expenseService.create(data);
    }
    fetchExpenses();
  };

  const handleDelete = async (id: string) => {
    await expenseService.delete(id);
    fetchExpenses();
  };

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Expenses</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real MongoDB financial records with instant voice command entry
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => expenseService.exportToCSV(expenses)}
            disabled={expenses.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-200 border border-white/10 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" /> Export CSV
          </button>

          <button
            type="button"
            onClick={startVoiceInput}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-all"
          >
            <Mic className="w-3.5 h-3.5" /> Voice Add
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsFormOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Summary Total Card */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-slate-400 font-medium">Filtered Total Spending</span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1 break-words">
            ₹{totalSpent.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-xs text-slate-400 font-medium">Record Count</span>
          <p className="text-base sm:text-lg font-semibold text-slate-200 mt-0.5 sm:mt-1">
            {expenses.length} transaction{expenses.length === 1 ? '' : 's'}
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search expense description..."
            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="bg-[#0B0F19] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-auto"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'All' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Order */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sb, so] = e.target.value.split('-');
              setSortBy(sb);
              setSortOrder(so as 'asc' | 'desc');
            }}
            className="bg-[#0B0F19] border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-auto"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Amount: High to Low</option>
            <option value="amount-asc">Amount: Low to High</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      {error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-300 text-xs">
          {error}
        </div>
      ) : expenses.length === 0 && !isLoading ? (
        <EmptyState
          icon={Receipt}
          title="No expenses found"
          description={
            search || category !== 'All'
              ? 'No expenses matched your search criteria.'
              : 'Start logging your spending easily with voice or manual entry.'
          }
          voiceHint="I spent 250 rupees on lunch today"
          actionText="Add First Expense"
          onAction={() => {
            setEditingExpense(null);
            setIsFormOpen(true);
          }}
        />
      ) : (
        <div className="bg-[#111827] border border-white/10 rounded-2xl overflow-hidden shadow-sm">
          <ExpenseTable
            expenses={expenses}
            isLoading={isLoading}
            onEdit={(exp) => {
              setEditingExpense(exp);
              setIsFormOpen(true);
            }}
            onDelete={handleDelete}
          />
        </div>
      )}

      {/* Modal Form */}
      <ExpenseFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingExpense}
      />
    </div>
  );
};

