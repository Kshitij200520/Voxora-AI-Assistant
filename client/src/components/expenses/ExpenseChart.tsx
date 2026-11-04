import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { ExpenseCategory } from '../../types';

interface ExpenseChartProps {
  categoryData: { category: ExpenseCategory; total: number; count: number }[];
  monthlyData: { name: string; total: number; count: number }[];
}

const COLORS = [
  '#6366F1', // Indigo
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#64748B', // Slate
];

export const ExpenseChart: React.FC<ExpenseChartProps> = ({
  categoryData,
  monthlyData,
}) => {
  const pieData = categoryData.map((d) => ({
    name: d.category,
    value: d.total,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#111827] border border-white/10 px-3 py-2 rounded-xl shadow-lg text-xs">
          <span className="font-semibold text-slate-200">{payload[0].name}</span>
          <span className="block text-indigo-400 font-bold mt-0.5">
            ₹{payload[0].value.toLocaleString('en-IN')}
          </span>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Category Breakdown (Donut Chart) */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col">
        <h4 className="text-sm font-semibold text-slate-200 mb-1">
          Spending by Category
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Breakdown of expenses recorded across categories
        </p>

        {pieData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
            No expense data available
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#111827"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Custom Legend */}
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 mt-2">
              {pieData.map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Monthly Trend (Bar Chart) */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 flex flex-col">
        <h4 className="text-sm font-semibold text-slate-200 mb-1">
          Monthly Expense Trend
        </h4>
        <p className="text-xs text-slate-400 mb-4">
          Total spending trend over recent months
        </p>

        {monthlyData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-500 py-12">
            No historical monthly data recorded yet
          </div>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis
                  dataKey="name"
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#64748B"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="total"
                  fill="#6366F1"
                  radius={[6, 6, 0, 0]}
                  maxBarSize={45}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

