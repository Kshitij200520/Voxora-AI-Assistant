import React from 'react';
import { useVoice } from '../../contexts/VoiceContext';
import { Mic, Radio, Volume2 } from 'lucide-react';

export const FloatingVoiceButton: React.FC = () => {
  const { isListening, isSpeaking, state, startVoiceInput, openModal } = useVoice();

  const handleClick = () => {
    if (isListening) {
      openModal();
    } else {
      startVoiceInput();
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40">
      <div className="relative group">
        {/* Glow backdrop */}
        <div
          className={`absolute -inset-1 rounded-full blur-md opacity-75 transition duration-500 group-hover:opacity-100 ${
            isListening
              ? 'bg-gradient-to-r from-rose-500 to-amber-500 animate-pulse'
              : isSpeaking
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 animate-pulse'
              : 'bg-gradient-to-r from-indigo-500 to-purple-500'
          }`}
        />

        {/* Action Button */}
        <button
          type="button"
          onClick={handleClick}
          className={`relative flex items-center gap-2 sm:gap-2.5 p-3 sm:px-4 sm:py-3 rounded-full text-white font-medium text-xs sm:text-sm shadow-xl transition-all duration-300 active:scale-95 ${
            isListening
              ? 'bg-rose-600 hover:bg-rose-700'
              : isSpeaking
              ? 'bg-cyan-600 hover:bg-cyan-700'
              : 'bg-[#151C2C] border border-white/20 hover:border-indigo-500 hover:bg-[#1E293B]'
          }`}
        >
          {isListening ? (
            <Radio className="w-5 h-5 text-white animate-pulse" />
          ) : isSpeaking ? (
            <Volume2 className="w-5 h-5 text-white animate-bounce" />
          ) : (
            <Mic className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
          )}

          <span className="hidden sm:inline">
            {isListening
              ? 'Listening...'
              : isSpeaking
              ? 'Speaking...'
              : 'Speak Command'}
          </span>
        </button>
      </div>
    </div>
  );
};

