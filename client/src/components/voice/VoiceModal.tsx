import React, { useState, useEffect, useRef } from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { useSettings } from '../../contexts/SettingsContext';
import { VoiceStatusBadge } from './VoiceStatusBadge';
import { AudioWaveform } from './AudioWaveform';
import {
  Mic,
  Square,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
  Send,
  AlertTriangle,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  User,
  Bot,
} from 'lucide-react';

export const VoiceModal: React.FC = () => {
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
    conversationMessages,
    sessionDuration,
    confirmationRequest,
    isModalOpen,
    closeModal,
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationMessages, interimTranscript]);

  if (!isModalOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualText.trim()) {
      processTextInput(manualText.trim());
      setManualText('');
    }
  };

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  const isWorking = state === 'PROCESSING' || state === 'PROCESSING_AI' || state === 'EXECUTING';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#111827] border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#151C2C]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white text-sm">VOXORA Voice Mode</h3>
                {isSessionActive && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <Clock className="w-3 h-3 animate-spin" />
                    {formatDuration(sessionDuration)}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">Continuous Hands-Free Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Selector */}
            <div className="flex bg-[#0B0F19] p-0.5 rounded-lg border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setLanguage('en-IN')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  language === 'en-IN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('hi-IN')}
                className={`px-2 py-1 rounded font-medium transition-all ${
                  language === 'hi-IN'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                HI
              </button>
            </div>

            <button
              onClick={closeModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Status Badge & Top Actions */}
          <div className="flex items-center justify-between">
            <VoiceStatusBadge state={state} />

            <div className="flex items-center gap-2">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all font-medium"
                >
                  <VolumeX className="w-3.5 h-3.5" /> Stop Voice
                </button>
              )}

              {isSessionActive ? (
                <button
                  type="button"
                  onClick={endSession}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30 transition-colors"
                >
                  End Session
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startSession}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
                >
                  Start Session
                </button>
              )}
            </div>
          </div>

          {/* Central Microphone Visualizer Anchor */}
          <div className="flex flex-col items-center justify-center py-3 bg-[#0B0F19]/60 rounded-xl border border-white/5">
            <div className="relative flex items-center justify-center">
              {isListening && (
                <>
                  <div className="absolute w-24 h-24 rounded-full bg-emerald-500/15 animate-ping duration-1000" />
                  <div className="absolute w-32 h-32 rounded-full border border-emerald-500/30 animate-pulse" />
                </>
              )}

              {state === 'USER_SPEAKING' && (
                <div className="absolute w-28 h-28 rounded-full bg-emerald-500/25 animate-ping duration-700" />
              )}

              {isSpeaking && (
                <div className="absolute w-24 h-24 rounded-full bg-cyan-500/20 animate-ping duration-1000" />
              )}

              <button
                type="button"
                onClick={isSessionActive ? endSession : startSession}
                disabled={isWorking}
                className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                  isListening
                    ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30'
                    : state === 'USER_SPEAKING'
                    ? 'bg-emerald-500 text-white ring-6 ring-emerald-500/40 scale-105'
                    : isSpeaking
                    ? 'bg-cyan-600 text-white ring-4 ring-cyan-500/30'
                    : isWorking
                    ? 'bg-indigo-600/50 text-indigo-200 cursor-wait'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 ring-4 ring-indigo-500/20 hover:scale-105'
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

            <div className="mt-2.5">
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
              />
            </div>

            <p className="text-[11px] text-slate-400 mt-1.5 font-medium">
              {state === 'USER_SPEAKING'
                ? 'Hearing you speak...'
                : state === 'LISTENING' && isListening
                ? 'Listening continuously... Speak naturally'
                : isSpeaking
                ? 'VOXORA is speaking...'
                : isWorking
                ? 'Processing context with Groq AI...'
                : state === 'RESTARTING'
                ? 'Reconnecting microphone...'
                : state === 'STARTING'
                ? 'Starting microphone...'
                : isSessionActive
                ? 'Reconnecting microphone...'
                : 'Click mic or Start Session to speak'}
            </p>
          </div>

          {/* Interim Transcript Alert */}
          {interimTranscript && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="italic">"{interimTranscript}..."</span>
            </div>
          )}

          {/* Multi-Turn Conversation History */}
          <div className="overflow-y-auto space-y-3 max-h-[220px] pr-1">
            {conversationMessages.length === 0 ? (
              <div className="py-6 text-center text-slate-500 text-xs">
                Conversation will appear here turn-by-turn.
              </div>
            ) : (
              conversationMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0 mt-0.5">
                      <Sparkles className="w-3 h-3" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-tr-sm shadow-sm'
                        : 'bg-[#0B0F19] border border-white/10 text-slate-200 rounded-tl-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3 text-[10px] opacity-75 mb-0.5">
                      <span className="font-semibold uppercase">
                        {msg.role === 'user' ? 'You' : 'VOXORA'}
                      </span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="font-normal">{msg.content}</p>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-6 h-6 rounded-lg bg-indigo-500 flex items-center justify-center text-white shrink-0 mt-0.5">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Confirmation Box */}
          {confirmationRequest && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="text-xs font-semibold text-amber-300">
                    Confirmation Required
                  </span>
                  <p className="text-xs text-amber-200/90 mt-0.5">{confirmationRequest.message}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={cancelConfirmation}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmAction}
                  className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-2.5 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button onClick={retry} className="text-xs underline font-semibold">
                Retry
              </button>
            </div>
          )}

          {/* Text Fallback Form */}
          <form onSubmit={handleManualSubmit} className="pt-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-[#0B0F19] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                disabled={isWorking}
              />
              <button
                type="submit"
                disabled={!manualText.trim() || isWorking}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white p-2 rounded-xl transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-white/10 bg-[#151C2C] flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={clearConversation}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear History
          </button>

          <span className="text-[11px] text-slate-400">
            {isSessionActive ? '🟢 Live Voice Session' : '⚪ Session Inactive'}
          </span>
        </div>
      </div>
    </div>
  );
};
