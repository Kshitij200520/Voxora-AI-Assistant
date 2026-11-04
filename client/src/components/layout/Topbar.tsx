import React from 'react';
import { useLocation } from 'react-router-dom';
import { useVoice } from '../../contexts/VoiceContext';
import { useSettings } from '../../contexts/SettingsContext';
import { Mic, Radio, Volume2, Globe, Bell } from 'lucide-react';

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

export const Topbar: React.FC = () => {
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
    <header className="h-16 bg-[#111827]/80 backdrop-blur-md border-b border-white/10 px-8 flex items-center justify-between sticky top-0 z-30">
      <div>
        <h2 className="text-base font-semibold text-slate-100">{current.title}</h2>
        <p className="text-xs text-slate-400 hidden sm:block">{current.subtitle}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Date tag */}
        <span className="text-xs text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 hidden md:inline-block">
          {currentDate}
        </span>

        {/* Notification Permission Indicator */}
        {notificationPermission !== 'granted' && (
          <button
            onClick={requestNotificationPermission}
            title="Enable browser notifications for reminders"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">Enable Alerts</span>
          </button>
        )}

        {/* Quick Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'en-IN' ? 'hi-IN' : 'en-IN')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs bg-white/5 text-slate-300 hover:text-white border border-white/10 transition-all"
          title="Toggle Language"
        >
          <Globe className="w-3.5 h-3.5 text-indigo-400" />
          <span>{language === 'en-IN' ? 'EN' : 'HI'}</span>
        </button>

        {/* Topbar Quick Mic Button */}
        <button
          onClick={startVoiceInput}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isListening
              ? 'bg-rose-600 text-white animate-pulse'
              : isSpeaking
              ? 'bg-cyan-600 text-white'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm'
          }`}
        >
          {isListening ? (
            <Radio className="w-4 h-4 animate-spin" />
          ) : isSpeaking ? (
            <Volume2 className="w-4 h-4" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {isListening ? 'Listening' : isSpeaking ? 'Speaking' : 'Speak'}
          </span>
        </button>
      </div>
    </header>
  );
};

