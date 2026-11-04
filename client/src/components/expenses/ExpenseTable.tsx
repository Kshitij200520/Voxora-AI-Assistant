import React, { useState } from 'react';
import { Expense } from '../../types';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { Edit2, Trash2, Tag, Calendar } from 'lucide-react';

interface ExpenseTableProps {
  expenses: Expense[];
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => Promise<void>;
  isLoading?: boolean;
}

const categoryColors: Record<string, string> = {
  Food: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Travel: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Shopping: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  Education: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  Entertainment: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Health: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Bills: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Other: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
};

export const ExpenseTable: React.FC<ExpenseTableProps> = ({
  expenses,
  onEdit,
  onDelete,
  isLoading,
}) => {
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3 py-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-[#111827] animate-pulse rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="bg-[#151C2C] text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-white/10">
            <tr>
              <th className="px-5 py-3.5">Description</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Date</th>
              <th className="px-5 py-3.5 text-right">Amount (₹)</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {expenses.map((expense) => {
              const catClass = categoryColors[expense.category] || categoryColors.Other;
              return (
                <tr
                  key={expense._id}
                  className="hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <span className="font-medium text-slate-100">{expense.description}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${catClass}`}
                    >
                      <Tag className="w-3 h-3" />
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-xs text-slate-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(expense.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold text-slate-100">
                    ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => onEdit(expense)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
                        title="Edit Expense"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(expense)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View */}
      <div className="md:hidden space-y-3">
        {expenses.map((expense) => {
          const catClass = categoryColors[expense.category] || categoryColors.Other;
          return (
            <div
              key={expense._id}
              className="bg-[#111827] border border-white/10 rounded-2xl p-4 space-y-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-slate-100 text-sm break-words">
                    {expense.description}
                  </h4>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 mt-2 rounded-full text-[11px] font-medium border ${catClass}`}
                  >
                    <Tag className="w-2.5 h-2.5 shrink-0" />
                    {expense.category}
                  </span>
                </div>
                <span className="text-base font-bold text-white shrink-0">
                  ₹{expense.amount.toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-white/5">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(expense.date).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEdit(expense)}
                    className="p-2 rounded-lg bg-white/5 text-slate-300 hover:text-white border border-white/5 hover:border-white/10 transition-colors"
                    title="Edit Expense"
                    aria-label="Edit Expense"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(expense)}
                    className="p-2 rounded-lg bg-rose-500/10 text-rose-400 hover:text-rose-300 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                    title="Delete Expense"
                    aria-label="Delete Expense"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => onDelete(deleteTarget._id)}
          title="Delete Expense"
          message={`Are you sure you want to delete "${deleteTarget.description}" for ₹${deleteTarget.amount.toLocaleString('en-IN')}? This record will be permanently deleted from MongoDB Atlas.`}
          confirmText="Delete Expense"
        />
      )}
    </>
  );
};

