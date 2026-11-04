import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { notificationService } from '../services/notificationService';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { aiService } from '../services/aiService';
import { api } from '../services/api';
import { UserNotificationSettings, NotificationHistoryItem } from '../types';
import {
  Mail,
  ShieldCheck,
  AlertTriangle,
  Bell,
  Send,
  Save,
  Trash2,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Database,
  Brain,
  Sliders,
  Volume2,
  Sparkles,
  RefreshCw,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser, refreshUser, logout } = useAuth();
  const {
    language,
    setLanguage,
    speechRate,
    setSpeechRate,
    autoSpeak,
    setAutoSpeak,
    health,
    isCheckingHealth,
    refreshHealth,
    notificationPermission,
    requestNotificationPermission,
  } = useSettings();

  const { speak } = useSpeechSynthesis();

  // Notification Preferences State
  const [notificationSettings, setNotificationSettings] = useState<UserNotificationSettings>({
    emailRemindersEnabled: true,
    taskDeadlineAlertsEnabled: false,
    upcomingReminderAlertsEnabled: false,
    timezone: user?.timezone || 'Asia/Kolkata',
  });
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [prefMessage, setPrefMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Test Email State
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delivery History
  const [history, setHistory] = useState<NotificationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Resend verification
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);

  // Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // AI Test State
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Fetch settings & history
  useEffect(() => {
    notificationService.getSettings()
      .then((res) => {
        if (res.success && res.data?.settings) {
          setNotificationSettings(res.data.settings);
        }
      })
      .catch(() => {});

    loadNotificationHistory();
  }, []);

  const loadNotificationHistory = () => {
    setIsLoadingHistory(true);
    notificationService.getHistory()
      .then((res) => {
        if (res.success && res.data) {
          setHistory(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setIsLoadingHistory(false));
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPreferences(true);
    setPrefMessage(null);

    try {
      const res = await notificationService.updateSettings(notificationSettings);
      if (res.success) {
        setPrefMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
      }
    } catch (err: any) {
      setPrefMessage({ type: 'error', text: err.message || 'Failed to save preferences.' });
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailResult(null);

    try {
      const res = await notificationService.sendTestNotification();
      if (res.success) {
        setTestEmailResult({
          type: 'success',
          text: `Test email dispatched to ${user?.email}! Check your inbox.`,
        });
        loadNotificationHistory();
      } else {
        setTestEmailResult({ type: 'error', text: res.message || 'Failed to dispatch test email.' });
      }
    } catch (err: any) {
      setTestEmailResult({
        type: 'error',
        text: err.message || 'Could not send test email. Ensure SMTP or Resend API key is configured.',
      });
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendStatus(null);
    try {
      const res = await authService.resendVerification();
      setResendStatus(res.message || 'Verification email sent! Please check your inbox.');
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to send verification email.');
    } finally {
      setIsResending(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);

    if (!deletePassword) {
      setDeleteError('Password is required to confirm account deletion.');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await userService.deleteAccount(deletePassword);
      if (res.success) {
        await logout();
      }
    } catch (err: any) {
      setDeleteError(err.message || 'Failed to delete account. Incorrect password.');
      setIsDeletingAccount(false);
    }
  };

  const handleTestSpeech = () => {
    const text =
      language === 'hi-IN'
        ? 'Namaste! Main VOXORA AI hoon. Aapki voice assistant bilkul taiyaar hai.'
        : 'Hello! VOXORA AI voice synthesis is operational and ready to assist you.';
    speak(text, { lang: language, rate: speechRate });
  };

  const handleTestGroqAi = async () => {
    try {
      setIsTestingAi(true);
      setTestResult(null);
      const res = await aiService.interpretVoice({
        text: 'I spent 100 rupees on coffee',
        language: language.startsWith('hi') ? 'hi' : 'en',
      });
      if (res.success && res.data) {
        setTestResult(
          `Success! Extracted ${res.data.actions.length} action(s). Response: "${res.data.response}"`
        );
      } else {
        setTestResult('AI returned error: ' + (res.error || 'Unknown error'));
      }
    } catch (err: any) {
      setTestResult(`Failed: ${err.message || 'Error communicating with server AI'}`);
    } finally {
      setIsTestingAi(false);
    }
  };

  const isDbConnected = health?.database?.connected;
  const isAiConfigured = health?.ai?.configured;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">Settings & Preferences</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage automated email reminders, voice assistant parameters, and security settings
        </p>
      </div>

      {/* 1. Automated Email Reminders Section */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-indigo-400" />
              Automated Email Reminders & Notifications
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Reminders are automatically sent to your verified registered email at their scheduled due time
            </p>
          </div>

          <button
            type="button"
            onClick={handleSendTestEmail}
            disabled={isSendingTestEmail}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 transition-colors self-start sm:self-center"
          >
            <Send className="w-3.5 h-3.5" />
            {isSendingTestEmail ? 'Sending Test...' : 'Send Test Email'}
          </button>
        </div>

        {/* Registered Email Card */}
        <div className="bg-[#0B0F19] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-white/5">
          <div>
            <span className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold block mb-0.5">
              Registered Recipient Email
            </span>
            <div className="flex items-center gap-2.5">
              <span className="text-sm font-semibold text-white font-mono">{user?.email}</span>
              {user?.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <ShieldCheck className="w-3 h-3" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  Unverified
                </span>
              )}
            </div>
            {!user?.isEmailVerified && (
              <p className="text-[11px] text-amber-400/80 mt-1">
                Please verify your email address to ensure real-time delivery of scheduled alerts.
              </p>
            )}
          </div>

          {!user?.isEmailVerified && (
            <button
              onClick={handleResendVerification}
              disabled={isResending}
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 rounded-lg text-xs font-medium transition-colors self-start sm:self-center"
            >
              {isResending ? 'Sending Link...' : 'Resend Verification'}
            </button>
          )}
        </div>

        {resendStatus && (
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs">
            {resendStatus}
          </div>
        )}

        {testEmailResult && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              testEmailResult.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {testEmailResult.text}
          </div>
        )}

        {prefMessage && (
          <div
            className={`p-3 rounded-xl text-xs border ${
              prefMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-300'
            }`}
          >
            {prefMessage.text}
          </div>
        )}

        {/* Preferences Form */}
        <form onSubmit={handleSavePreferences} className="space-y-4">
          <div className="space-y-3">
            {/* Toggle 1: Email Reminders */}
            <div className="flex items-center justify-between p-3.5 bg-[#0B0F19] rounded-xl border border-white/5">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Enable Scheduled Email Reminders
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Automatically dispatch an email notification when a reminder reaches its due time
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotificationSettings((s) => ({
                    ...s,
                    emailRemindersEnabled: !s.emailRemindersEnabled,
                  }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  notificationSettings.emailRemindersEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notificationSettings.emailRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2: Task Deadline Alerts */}
            <div className="flex items-center justify-between p-3.5 bg-[#0B0F19] rounded-xl border border-white/5">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">Task Deadline Alerts</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Send reminder alerts for pending tasks that have upcoming due dates
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotificationSettings((s) => ({
                    ...s,
                    taskDeadlineAlertsEnabled: !s.taskDeadlineAlertsEnabled,
                  }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  notificationSettings.taskDeadlineAlertsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notificationSettings.taskDeadlineAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3: Upcoming Alerts 1-hour prior */}
            <div className="flex items-center justify-between p-3.5 bg-[#0B0F19] rounded-xl border border-white/5">
              <div>
                <h3 className="text-xs font-semibold text-slate-200">
                  Advance Reminder Warning (1 Hour Before)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Receive a preview email alert 1 hour prior to reminder time
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setNotificationSettings((s) => ({
                    ...s,
                    upcomingReminderAlertsEnabled: !s.upcomingReminderAlertsEnabled,
                  }))
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  notificationSettings.upcomingReminderAlertsEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    notificationSettings.upcomingReminderAlertsEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSavingPreferences}
              className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800/50 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-indigo-600/20"
            >
              <Save className="w-3.5 h-3.5" />
              {isSavingPreferences ? 'Saving...' : 'Save Notification Preferences'}
            </button>
          </div>
        </form>

        {/* Notification Delivery History */}
        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-200 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Email Notification Delivery Log
            </h3>
            <button
              type="button"
              onClick={loadNotificationHistory}
              disabled={isLoadingHistory}
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${isLoadingHistory ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {history.length === 0 ? (
            <div className="bg-[#0B0F19] rounded-xl p-6 text-center text-xs text-slate-400">
              No reminder emails have been dispatched yet. Create a reminder or click "Send Test Email" to test.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/5">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F19] text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-2.5 font-medium">Reminder Title</th>
                    <th className="px-4 py-2.5 font-medium">Scheduled For</th>
                    <th className="px-4 py-2.5 font-medium">Delivery Status</th>
                    <th className="px-4 py-2.5 font-medium">Dispatched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-[#111827]">
                  {history.map((item) => (
                    <tr key={item._id} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-white font-medium">{item.title}</td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {new Date(item.dueAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            item.emailStatus === 'sent'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                              : item.emailStatus === 'processing'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : item.emailStatus === 'failed'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-slate-700/30 text-slate-400 border-slate-700'
                          }`}
                        >
                          {item.emailStatus.toUpperCase()}
                        </span>
                        {item.emailError && (
                          <span className="block text-[10px] text-rose-400 mt-0.5 max-w-[200px] truncate" title={item.emailError}>
                            {item.emailError}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-slate-400 font-mono text-[11px]">
                        {item.emailSentAt ? new Date(item.emailSentAt).toLocaleTimeString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 2. Voice Assistant Preferences */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" /> Voice Assistant Preferences
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure speech recognition language and SpeechSynthesis voice playback
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-2">
              Default Voice Language
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  language === 'en-IN'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#0B0F19] border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold block text-sm">English (India)</span>
                <span className="text-[11px] text-slate-400 mt-0.5">en-IN dialect & INR</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`p-3 rounded-xl border text-left text-xs transition-all ${
                  language === 'hi-IN'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                    : 'bg-[#0B0F19] border-white/10 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className="font-bold block text-sm">हिन्दी (India)</span>
                <span className="text-[11px] text-slate-400 mt-0.5">hi-IN transcription</span>
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-slate-300">
                Speech Output Speed: {speechRate}x
              </label>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.3"
              step="0.1"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 bg-[#0B0F19] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>0.8x (Slower)</span>
              <span>1.0x (Normal)</span>
              <span>1.3x (Faster)</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <div>
            <h3 className="text-xs font-semibold text-slate-200">
              Auto-Speak Execution Confirmations
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Automatically vocalize responses after AI executes your commands
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAutoSpeak(!autoSpeak)}
            className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
              autoSpeak ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                autoSpeak ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handleTestSpeech}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 transition-colors"
          >
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> Test Voice Synthesis
          </button>
        </div>
      </div>

      {/* 3. System Diagnostics & Infrastructure */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* MongoDB Atlas Card */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isDbConnected
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">MongoDB Atlas</h3>
                <p className="text-xs text-slate-400">Multi-Tenant Persistence</p>
              </div>
            </div>

            <button
              onClick={refreshHealth}
              disabled={isCheckingHealth}
              className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh status"
            >
              <RefreshCw
                className={`w-4 h-4 ${isCheckingHealth ? 'animate-spin text-indigo-400' : ''}`}
              />
            </button>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Connection State:</span>
              <span
                className={`font-semibold flex items-center gap-1.5 ${
                  isDbConnected ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {isDbConnected ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3.5 h-3.5" /> Disconnected
                  </>
                )}
              </span>
            </div>
            {health?.database?.databaseName && (
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Database:</span>
                <span className="text-slate-200 font-mono text-[11px]">
                  {health.database.databaseName}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Groq AI Engine Card */}
        <div className="bg-[#111827] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isAiConfigured
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                    : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`}
              >
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Groq AI Engine</h3>
                <p className="text-xs text-slate-400">Natural Language Understanding</p>
              </div>
            </div>

            <button
              onClick={handleTestGroqAi}
              disabled={isTestingAi}
              className="px-2.5 py-1 rounded-lg text-xs bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 transition-all font-medium flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" /> {isTestingAi ? 'Testing...' : 'Test AI'}
            </button>
          </div>

          <div className="bg-[#0B0F19] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">AI Provider:</span>
              <span className="text-slate-200 font-semibold">Groq (Ultra-Fast LLM)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Configured Model:</span>
              <span className="text-indigo-400 font-mono text-[11px]">
                {health?.ai?.model || 'qwen/qwen3.8-27b'}
              </span>
            </div>
          </div>

          {testResult && (
            <div className="p-2.5 bg-indigo-950/40 border border-indigo-500/20 rounded-xl text-xs text-indigo-300">
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* 4. Danger Zone: Delete Account */}
      <div className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-rose-300 flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              Delete Account & Data
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Permanently delete your VOXORA account and all associated expenses, tasks, reminders, and activity logs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-semibold transition-colors self-start sm:self-center"
          >
            Delete Account...
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-rose-500/30 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              This action <strong>cannot be undone</strong>. All your expenses, tasks, reminders, and voice history will be permanently deleted from MongoDB Atlas immediately.
            </p>

            {deleteError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirm your password:
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2 bg-[#0B0F19] border border-white/10 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-rose-500 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDeletingAccount}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Yes, Delete Everything'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
