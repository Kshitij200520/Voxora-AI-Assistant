import { Schema, model, Document, Types } from 'mongoose';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Travel',
  'Shopping',
  'Education',
  'Entertainment',
  'Health',
  'Bills',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface IExpense extends Document {
  userId?: Types.ObjectId;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  description: string;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: EXPENSE_CATEGORIES,
        message: '{VALUE} is not a valid expense category',
      },
      default: 'Other',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1, date: -1 });

export const Expense = model<IExpense>('Expense', ExpenseSchema);
