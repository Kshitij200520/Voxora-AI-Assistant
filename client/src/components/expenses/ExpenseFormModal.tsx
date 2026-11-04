import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Expense, ExpenseCategory } from '../../types';

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    amount: number;
    currency?: string;
    category: ExpenseCategory;
    description: string;
    date?: string;
  }) => Promise<void>;
  initialData?: Expense | null;
}

const CATEGORIES: ExpenseCategory[] = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Health',
  'Bills',
  'Other',
];

export const ExpenseFormModal: React.FC<ExpenseFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setAmount(String(initialData.amount));
      setCategory(initialData.category);
      setDescription(initialData.description);
      setDate(new Date(initialData.date).toISOString().split('T')[0]);
    } else {
      setAmount('');
      setCategory('Food');
      setDescription('');
      setDate(new Date().toISOString().split('T')[0]);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Amount must be greater than zero');
      return;
    }
    if (!description.trim()) {
      setError('Description is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        amount: parsedAmount,
        currency: 'INR',
        category,
        description: description.trim(),
        date,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Expense' : 'Add Expense'}
      subtitle="Manual entry into MongoDB Atlas"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Amount (₹ INR) *
          </label>
          <input
            type="number"
            step="0.01"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="e.g. 250"
            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1.5">
            Description *
          </label>
          <input
            type="text"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Lunch with colleagues"
            className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0B0F19] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500"
            >
            </input>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-white/5 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs font-medium bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm transition-all"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Save Changes' : 'Create Expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

