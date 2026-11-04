import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '../contexts/VoiceContext';
import { useSettings } from '../contexts/SettingsContext';
import { VoiceStatusBadge } from '../components/voice/VoiceStatusBadge';
import { AudioWaveform } from '../components/voice/AudioWaveform';
import { ActionPreviewCard } from '../components/voice/ActionPreviewCard';
import {
  Mic,
  MicOff,
  Square,
  Volume2,
  VolumeX,
  RotateCcw,
  Send,
  Sparkles,
  Zap,
  Globe,
  AlertTriangle,
  Flame,
  Radio,
  Clock,
  Play,
  CheckCircle2,
  User,
  Bot,
  Headphones,
} from 'lucide-react';

const DEMO_PRESETS = [
  {
    label: 'Turn 1: Natural Greeting',
    command: 'Hi, how are you today?',
    desc: 'Starts conversation with conversational greetings (AI replies & stays listening)',
  },
  {
    label: 'Turn 2: Create Expense',
    command: 'I spent 500 rupees on shopping today.',
    desc: 'Records ₹500 Shopping expense in Atlas and speaks confirmation',
  },
  {
    label: 'Turn 3: Follow-Up Modification',
    command: 'Actually change that to 750.',
    desc: 'Uses conversation memory to update the previous shopping expense',
  },
  {
    label: 'Turn 4: Relative Reminder',
    command: 'Remind me to call Rohit tomorrow at 6 PM.',
    desc: 'Creates a reminder with automated email delivery alert',
  },
  {
    label: 'Turn 5: Aggregate Spending Query',
    command: 'How much did I spend today?',
    desc: 'Queries actual MongoDB Atlas records and speaks live summary',
  },
  {
    label: 'Turn 6: End Session',
    command: 'End conversation.',
    desc: 'Hands-free voice command to terminate session cleanly',
  },
];

export const VoiceAssistantPage: React.FC = () => {
  const {
    state,
    transcript,
    interimTranscript,
    error,
    detectedActions,
    executionResults,
    spokenResponse,
    isListening,
    isSpeaking,
    isSessionActive,
    sessionId,
    conversationMessages,
    sessionDuration,
    confirmationRequest,
    startSession,
    endSession,
    processTextInput,
    confirmAction,
    cancelConfirmation,
    stopSpeaking,
    retry,
    clearConversation,
  } = useVoice();

  const { language, setLanguage } = useSettings();
  const [manualText, setManualText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll conversation stream to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages, interimTranscript]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      processTextInput(manualText.trim());
      setManualText('');
    }
  };

  const handleRunPreset = (presetCommand: string) => {
    if (!isSessionActive) {
      startSession();
    }
    setManualText(presetCommand);
    processTextInput(presetCommand);
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const isWorking = state === 'PROCESSING' || state === 'PROCESSING_AI' || state === 'EXECUTING';

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Top Session Header */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">Continuous Voice Mode</h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Alexa-Style Hands-Free
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Click once to speak. Listen & talk continuously without pressing any buttons.
            </p>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex items-center gap-2 sm:gap-2.5 self-start sm:self-center flex-wrap">
          {/* Language Selector */}
          <div className="flex bg-[#0B0F19] p-1 rounded-xl border border-white/10 text-xs">
            <button
              onClick={() => setLanguage('en-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                language === 'en-IN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setLanguage('hi-IN')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                language === 'hi-IN'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिन्दी
            </button>
          </div>

          {/* Session Timer Badge */}
          {isSessionActive && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-semibold">
              <Clock className="w-3.5 h-3.5 animate-spin" />
              <span>{formatDuration(sessionDuration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Conversation Engine Card */}
      <div className="bg-[#111827] border border-white/10 rounded-2xl p-4 sm:p-6 relative overflow-hidden shadow-2xl flex flex-col min-h-[420px] sm:min-h-[480px]">
        {/* Status Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 sm:pb-4 border-b border-white/10">
          <VoiceStatusBadge state={state} />

          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {isSpeaking && (
              <button
                type="button"
                onClick={stopSpeaking}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 transition-all"
              >
                <VolumeX className="w-3.5 h-3.5" /> Stop Speaking
              </button>
            )}

            {isSessionActive ? (
              <button
                type="button"
                onClick={endSession}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 transition-colors"
              >
                <Square className="w-3.5 h-3.5" /> End Conversation
              </button>
            ) : (
              <button
                type="button"
                onClick={startSession}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md shadow-indigo-600/20"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Voice Session
              </button>
            )}

            {conversationMessages.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg transition-colors"
                title="Clear transcript"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Central Audio Visualizer Anchor */}
        <div className="py-4 flex flex-col items-center justify-center border-b border-white/5 bg-[#0B0F19]/60 rounded-xl my-4">
          <div className="relative flex items-center justify-center mb-2">
            {isListening && (
              <>
                <div className="absolute w-24 h-24 rounded-full bg-emerald-500/20 animate-ping duration-1000" />
                <div className="absolute w-28 h-28 rounded-full border border-emerald-500/30 animate-pulse" />
              </>
            )}

            {state === 'USER_SPEAKING' && (
              <div className="absolute w-28 h-28 rounded-full bg-emerald-500/30 animate-ping duration-700" />
            )}

            {isSpeaking && (
              <div className="absolute w-28 h-28 rounded-full bg-cyan-500/25 animate-ping duration-1000" />
            )}

            <button
              type="button"
              onClick={isSessionActive ? endSession : startSession}
              disabled={isWorking}
              className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isListening
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 scale-105'
                  : state === 'USER_SPEAKING'
                  ? 'bg-emerald-500 text-white ring-8 ring-emerald-500/40 scale-110'
                  : isSpeaking
                  ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/30'
                  : isWorking
                  ? 'bg-indigo-600/50 text-indigo-200 cursor-wait'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white ring-4 ring-indigo-500/20 hover:scale-105'
              }`}
            >
              {isListening || state === 'USER_SPEAKING' ? (
                <Mic className="w-7 h-7" />
              ) : isSpeaking ? (
                <Volume2 className="w-7 h-7 animate-bounce" />
              ) : isWorking ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          {/* Waveform */}
          <AudioWaveform
            active={isListening || state === 'USER_SPEAKING' || isSpeaking}
            color={
              isSpeaking
                ? 'bg-cyan-400'
                : state === 'USER_SPEAKING'
                ? 'bg-emerald-300'
                : isListening
                ? 'bg-emerald-400'
                : 'bg-indigo-500'
            }
            bars={28}
          />

          <p className="text-[11px] text-slate-400 mt-2 font-medium">
            {state === 'USER_SPEAKING'
              ? 'Hearing you speak...'
              : state === 'LISTENING' && isListening
              ? 'Listening continuously... Speak your request naturally'
              : isWorking
              ? 'Analyzing context with Groq AI & executing database actions...'
              : isSpeaking
              ? 'VOXORA is speaking confirmation...'
              : state === 'RESTARTING'
              ? 'Reconnecting microphone...'
              : state === 'STARTING'
              ? 'Starting microphone...'
              : isSessionActive
              ? 'Reconnecting microphone...'
              : state === 'STOPPED'
              ? 'Session ended. Click Start to begin a new hands-free conversation.'
              : 'Click Start Voice Session to begin continuous conversation.'}
          </p>

          {/* Turn-Based Voice Coordination Notice */}
          {isSessionActive && (
            <div className="mt-2.5 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 max-w-md mx-auto text-left sm:text-center">
              <Headphones className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              <span>
                <strong>Turn-Based Voice:</strong> Mic turns off automatically while AI speaks. Moderate volume or earphones recommended on phones.
              </span>
            </div>
          )}
        </div>

        {/* Live Interim Transcript Bubble */}
        {interimTranscript && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="font-semibold text-emerald-300">Hearing:</span>
            <span className="italic">"{interimTranscript}..."</span>
          </div>
        )}

        {/* Multi-Turn Conversation Stream */}
        <div className="flex-1 overflow-y-auto space-y-4 max-h-[420px] pr-2">
          {conversationMessages.length === 0 ? (
            <div className="h-44 flex flex-col items-center justify-center text-center text-slate-500 space-y-2">
              <Bot className="w-8 h-8 text-slate-600" />
              <p className="text-xs">No messages yet. Say "Hi" or speak a command to start.</p>
              <p className="text-[11px] text-slate-600">
                Example: "I spent 250 on lunch and remind me to call Rohit tomorrow at 10 AM"
              </p>
            </div>
          ) : (
            conversationMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-1">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[88%] sm:max-w-[80%] break-words rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                      : 'bg-[#0B0F19] border border-white/10 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-1 text-[10px] opacity-75">
                    <span className="font-semibold uppercase tracking-wider">
                      {msg.role === 'user' ? 'You' : 'VOXORA AI'}
                    </span>
                    <span className="shrink-0">{msg.timestamp}</span>
                  </div>

                  <p className="text-xs sm:text-sm font-normal break-words">{msg.content}</p>

                  {/* Render any actions executed in this turn */}
                  {msg.actions && msg.actions.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">
                        Actions Triggered ({msg.actions.length})
                      </span>
                      {msg.actions.map((action, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 text-[11px] bg-white/5 px-2 py-1 rounded-lg border border-white/5 max-w-full overflow-hidden"
                        >
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="font-semibold text-slate-300 shrink-0">{action.type}:</span>
                          <span className="text-slate-400 truncate break-all max-w-[140px] sm:max-w-[220px]">
                            {JSON.stringify(action.payload)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center text-white shrink-0 mt-1 text-[11px] font-bold">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Destructive Action Verbal Confirmation Box */}
        {confirmationRequest && (
          <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 sm:p-4 space-y-2 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <span className="text-xs font-semibold text-amber-300 block">
                  Confirmation Required (Say "Yes" or "Cancel")
                </span>
                <p className="text-xs text-amber-200/90 mt-0.5 break-words">{confirmationRequest.message}</p>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={cancelConfirmation}
                className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/5 transition-all text-center"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmAction}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-sm transition-all text-center"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mt-3 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button onClick={retry} className="text-xs font-semibold underline hover:text-white">
              Retry
            </button>
          </div>
        )}

        {/* Text Fallback Input Bar */}
        <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Or type your message in natural language..."
              className="flex-1 bg-[#0B0F19] border border-white/10 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              disabled={isWorking}
            />
            <button
              type="submit"
              disabled={!manualText.trim() || isWorking}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </div>
        </form>
      </div>

      {/* Preset Demo Commands */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Interactive Test Commands (Continuous Voice Multi-Turn)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {DEMO_PRESETS.map((preset, index) => (
            <div
              key={index}
              className="bg-[#111827] border border-white/10 hover:border-indigo-500/50 rounded-xl p-3.5 transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400">{preset.label}</span>
                  <span className="text-[10px] text-slate-500">#{index + 1}</span>
                </div>
                <p className="text-xs text-slate-200 font-medium mt-1">"{preset.command}"</p>
                <p className="text-[10px] text-slate-400 mt-0.5">{preset.desc}</p>
              </div>

              <div className="mt-2 pt-2 border-t border-white/5 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => handleRunPreset(preset.command)}
                  disabled={isWorking}
                  className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 group-hover:translate-x-0.5 transition-all"
                >
                  <Zap className="w-3 h-3 text-amber-400" /> Test Command
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
