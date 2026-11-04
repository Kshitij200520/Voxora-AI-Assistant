import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { VoiceModal } from '../voice/VoiceModal';
import { FloatingVoiceButton } from '../voice/FloatingVoiceButton';
import { useRemindersNotifier } from '../../hooks/useRemindersNotifier';
import { useSettings } from '../../contexts/SettingsContext';
import { AlertCircle } from 'lucide-react';

export const AppLayout: React.FC = () => {
  // Initialize background reminders watcher
  useRemindersNotifier();
  const { health } = useSettings();
  const isDbConnected = health?.database?.connected;

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar />

        {/* Database Warning Banner if not connected */}
        {health && !isDbConnected && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-8 py-2.5 flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>
                <strong>MongoDB Atlas Disconnected:</strong> {health.database.error || 'Please configure MONGODB_URI in server/.env'}
              </span>
            </div>
            <a
              href="/settings"
              className="text-xs font-medium text-rose-400 underline hover:text-rose-200"
            >
              Configure in Settings
            </a>
          </div>
        )}

        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Global Voice Assistant Modal */}
      <VoiceModal />

      {/* Floating Action Button */}
      <FloatingVoiceButton />
    </div>
  );
};

