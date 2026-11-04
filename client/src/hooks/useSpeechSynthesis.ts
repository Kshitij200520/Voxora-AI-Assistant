import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseSpeechSynthesisReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  voices: SpeechSynthesisVoice[];
  speak: (
    text: string,
    options?: {
      lang?: string;
      rate?: number;
      pitch?: number;
      voiceName?: string;
      onEnd?: () => void;
      onError?: (err: any) => void;
    }
  ) => void;
  stop: () => void;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const safetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const loadVoices = useCallback(() => {
    if (!isSupported) return;
    const available = window.speechSynthesis.getVoices();
    setVoices(available);
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
      }
      if (window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported, loadVoices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    if (safetyTimeoutRef.current) {
      clearTimeout(safetyTimeoutRef.current);
      safetyTimeoutRef.current = null;
    }
    console.log('[useSpeechSynthesis] ⏹️ stop called');
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  const speak = useCallback(
    (
      text: string,
      options: {
        lang?: string;
        rate?: number;
        pitch?: number;
        voiceName?: string;
        onEnd?: () => void;
        onError?: (err: any) => void;
      } = {}
    ) => {
      if (!isSupported || !text || text.trim().length === 0) {
        console.log('[useSpeechSynthesis] Skipping speak (empty or unsupported)');
        options.onEnd?.();
        return;
      }

      if (safetyTimeoutRef.current) {
        clearTimeout(safetyTimeoutRef.current);
        safetyTimeoutRef.current = null;
      }

      // Stop any ongoing speech cleanly
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1.0;
      utterance.pitch = options.pitch ?? 1.0;
      utterance.lang = options.lang ?? 'en-IN';

      // Pick matching voice
      if (voices.length > 0) {
        let selectedVoice: SpeechSynthesisVoice | undefined;

        if (options.voiceName) {
          selectedVoice = voices.find((v) => v.name === options.voiceName);
        }

        if (!selectedVoice) {
          if (utterance.lang.startsWith('hi')) {
            selectedVoice = voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi'));
          } else {
            selectedVoice =
              voices.find((v) => v.lang === 'en-IN' || v.lang === 'en_IN') ||
              voices.find((v) => v.lang.startsWith('en'));
          }
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      let ended = false;
      const handleEnd = () => {
        if (ended) return;
        ended = true;
        console.log('[useSpeechSynthesis] 🔇 utterance.onend: AI speech complete');
        if (safetyTimeoutRef.current) {
          clearTimeout(safetyTimeoutRef.current);
          safetyTimeoutRef.current = null;
        }
        setIsSpeaking(false);
        options.onEnd?.();
      };

      utterance.onstart = () => {
        console.log('[useSpeechSynthesis] 🔊 utterance.onstart: AI speaking: "' + text.slice(0, 40) + '..."');
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        handleEnd();
      };

      utterance.onerror = (e) => {
        console.warn('[useSpeechSynthesis] ⚠️ utterance.onerror:', e);
        if (!ended) {
          ended = true;
          if (safetyTimeoutRef.current) {
            clearTimeout(safetyTimeoutRef.current);
            safetyTimeoutRef.current = null;
          }
          setIsSpeaking(false);
          if (options.onError) {
            options.onError(e);
          } else {
            options.onEnd?.();
          }
        }
      };

      // Safety fallback: if onend does not fire within estimated duration + 2.5s buffer
      const wordCount = text.split(/\s+/).length;
      const estimatedDurationMs = Math.max(2500, (wordCount / (options.rate || 1)) * 450 + 2000);
      safetyTimeoutRef.current = setTimeout(() => {
        if (!ended) {
          console.warn('[useSpeechSynthesis] ⏱️ Safety timeout fired (utterance did not trigger onend)');
          handleEnd();
        }
      }, estimatedDurationMs);

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, voices]
  );

  return {
    isSupported,
    isSpeaking,
    voices,
    speak,
    stop,
  };
}
