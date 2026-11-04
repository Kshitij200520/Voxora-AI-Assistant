import React from 'react';
import { useLocation } from 'react-router-dom';
import { useVoice } from '../../contexts/VoiceContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Mic, Radio, Volume2, Globe, Bell, Menu } from 'lucide-react';

const titleMap: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Real-time overview of your finances, tasks, and reminders' },
  '/voice': { title: 'Voice Assistant', subtitle: 'Speak naturally to execute multi-intent actions' },
  '/expenses': { title: 'Expense Tracker', subtitle: 'Manage expenses with INR formatting and CSV export' },
  '/tasks': { title: 'Task Manager', subtitle: 'Prioritize, track, and complete your tasks' },
  '/reminders': { title: 'Reminders', subtitle: 'Scheduled alerts with automated email triggers' },
  '/activity': { title: 'Activity History', subtitle: 'Audit log of actions, AI interpretations, and updates' },
  '/profile': { title: 'User Profile', subtitle: 'Manage your personal account, email, and security settings' },
  '/settings': { title: 'Settings', subtitle: 'Configure email reminder notifications, voice parameters, and system keys' },
};

interface TopbarProps {
  onOpenMobileSidebar?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onOpenMobileSidebar }) => {
  const location = useLocation();
  const { startVoiceInput, isListening, isSpeaking } = useVoice();
  const { language, setLanguage, notificationPermission, requestNotificationPermission } = useSettings();

  const current = titleMap[location.pathname] || {
    title: 'VOXORA AI',
    subtitle: 'Your Voice. Your Personal AI Action Assistant.',
  };

  const currentDate = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-white/10 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        {onOpenMobileSidebar && (
          <button
            type="button"
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 -ml-1 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 active:scale-95 transition-all shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="truncate min-w-0">
          <h2 className="text-sm sm:text-base font-semibold text-slate-100 truncate">{current.title}</h2>
          <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block truncate">{current.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Date tag */}
        <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hidden md:inline-block">
          {currentDate}
        </span>

        {/* Notification Permission Indicator */}
        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            title="Enable browser notifications for reminders"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all shrink-0"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Enable Alerts</span>
          </button>
        )}

        {/* Quick Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en-IN' ? 'hi-IN' : 'en-IN')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-all shrink-0"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="font-semibold">{language === 'en-IN' ? 'EN' : 'HI'}</span>
        </button>

        {/* Topbar Quick Mic Button */}
        <button
          onClick={startVoiceInput}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : isSpeaking
              ? 'bg-cyan-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
          }`}
        >
          {isListening ? (
            <Radio className="w-4 h-4 animate-spin shrink-0" />
          ) : isSpeaking ? (
            <Volume2 className="w-4 h-4 shrink-0" />
          ) : (
            <Mic className="w-4 h-4 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Speak'}
          </span>
        </button>
      </div>
    </header>
  );
};

