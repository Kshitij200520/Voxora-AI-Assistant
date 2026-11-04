import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconBg = 'bg-indigo-500/10 border-indigo-500/20',
  iconColor = 'text-indigo-400',
  trend,
}) => {
  return (
    <div className="bg-[#111827] border border-white/10 rounded-2xl p-5 shadow-sm hover:border-white/20 transition-all">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-400">{title}</span>
        <div className={`p-2.5 rounded-xl border ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3">
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight break-words">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
      </div>

      {trend && (
        <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-xs">
          <span
            className={`font-semibold ${
              trend.isPositive ? 'text-emerald-400' : 'text-slate-400'
            }`}
          >
            {trend.value}
          </span>
          <span className="text-slate-500">recorded</span>
        </div>
      )}
    </div>
  );
};

