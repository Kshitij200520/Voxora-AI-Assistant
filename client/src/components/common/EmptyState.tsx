import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  voiceHint?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  voiceHint,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[#111827]/60 border border-white/5 rounded-2xl">
      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
        <Icon className="w-6 h-6" />
      </div>

      <h4 className="text-base font-semibold text-slate-200">{title}</h4>
      <p className="text-xs text-slate-400 max-w-sm mt-1">{description}</p>

      {voiceHint && (
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300">
          <span>🎤 Say:</span>
          <span className="italic font-medium">"{voiceHint}"</span>
        </div>
      )}

      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-all shadow-sm"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

