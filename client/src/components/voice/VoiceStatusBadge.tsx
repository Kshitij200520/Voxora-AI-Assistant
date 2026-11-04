import React from 'react';
import { VoiceState } from '../../types';
import {
  Mic,
  Brain,
  Database,
  Volume2,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Radio,
  Loader2,
  Square,
  Sparkles,
} from 'lucide-react';

interface VoiceStatusBadgeProps {
  state: VoiceState;
}

export const VoiceStatusBadge: React.FC<VoiceStatusBadgeProps> = ({ state }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'STARTING':
        return {
          label: 'Connecting Voice Engine...',
          icon: Loader2,
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          dot: 'bg-indigo-400 animate-spin',
        };
      case 'LISTENING':
        return {
          label: 'Listening... Speak naturally',
          icon: Radio,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10',
          dot: 'bg-emerald-400 animate-ping',
        };
      case 'USER_SPEAKING':
        return {
          label: 'Listening to your voice...',
          icon: Mic,
          bg: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-300 animate-pulse',
        };
      case 'PROCESSING':
      case 'PROCESSING_AI':
        return {
          label: 'Understanding your request...',
          icon: Brain,
          bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400',
          dot: 'bg-indigo-400 animate-spin',
        };
      case 'EXECUTING':
        return {
          label: 'Executing action in MongoDB Atlas...',
          icon: Database,
          bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
          dot: 'bg-purple-400 animate-pulse',
        };
      case 'AI_SPEAKING':
      case 'SPEAKING':
        return {
          label: 'VOXORA is speaking...',
          icon: Volume2,
          bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
          dot: 'bg-cyan-400 animate-pulse',
        };
      case 'RESTARTING':
        return {
          label: 'Reconnecting microphone...',
          icon: Sparkles,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 animate-pulse',
        };
      case 'AWAITING_CONFIRMATION':
        return {
          label: 'Confirmation Required',
          icon: AlertTriangle,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400 animate-bounce',
        };
      case 'SUCCESS':
        return {
          label: 'Action Completed',
          icon: CheckCircle2,
          bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
          dot: 'bg-emerald-400',
        };
      case 'PARTIAL_SUCCESS':
        return {
          label: 'Partially Completed',
          icon: AlertTriangle,
          bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
          dot: 'bg-amber-400',
        };
      case 'STOPPED':
        return {
          label: 'Voice session ended',
          icon: Square,
          bg: 'bg-slate-800/60 border-slate-700/60 text-slate-400',
          dot: 'bg-slate-500',
        };
      case 'ERROR':
        return {
          label: 'Error Occurred',
          icon: AlertCircle,
          bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
          dot: 'bg-rose-400',
        };
      case 'IDLE':
      default:
        return {
          label: 'Voice Ready — Click Start',
          icon: HelpCircle,
          bg: 'bg-slate-800/80 border-slate-700 text-slate-300',
          dot: 'bg-slate-400',
        };
    }
  };

  const { label, icon: Icon, bg, dot } = getBadgeConfig();

  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${bg} transition-all duration-300`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
      <Icon className="w-3.5 h-3.5 shrink-0" />
      <span>{label}</span>
    </span>
  );
};
