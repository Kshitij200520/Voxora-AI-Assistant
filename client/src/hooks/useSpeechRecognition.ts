import { useState, useEffect, useRef, useCallback } from 'react';

// Declare Web Speech API interfaces for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface UseSpeechRecognitionCallbacks {
  onStart?: () => void;
  onFinalTranscript?: (transcript: string) => void;
  onInterimTranscript?: (interim: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onEnd?: () => void;
  onNoSpeech?: () => void;
  onError?: (error: string, isFatal: boolean) => void;
  isAISpeaking?: () => boolean;
  isProcessing?: () => boolean;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  isUserSpeaking: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  startListening: (options?: { lang?: string }) => void;
  stopListening: () => void;
  abortListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(
  callbacks: UseSpeechRecognitionCallbacks | ((transcript: string) => void) = {}
): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const isStartingRef = useRef<boolean>(false);
  const isRunningRef = useRef<boolean>(false);
  const isExplicitlyStoppedRef = useRef<boolean>(true);
  const isComponentMountedRef = useRef<boolean>(true);
  const pendingStartRef = useRef<{ lang?: string } | null>(null);
  const callbacksRef = useRef<UseSpeechRecognitionCallbacks>({});

  // Synchronize callbacks ref
  useEffect(() => {
    if (typeof callbacks === 'function') {
      callbacksRef.current = { onFinalTranscript: callbacks };
    } else {
      callbacksRef.current = callbacks;
    }
  }, [callbacks]);

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setError(null);
  }, []);

  const stopListening = useCallback(() => {
    console.log('[useSpeechRecognition] ⏹️ stopListening called');
    isExplicitlyStoppedRef.current = true;
    pendingStartRef.current = null;
    isStartingRef.current = false;

    if (recognitionRef.current && isRunningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('[useSpeechRecognition] Error during stop():', e);
      }
    }
  }, []);

  const abortListening = useCallback(() => {
    console.log('[useSpeechRecognition] 🛑 abortListening called');
    isExplicitlyStoppedRef.current = true;
    pendingStartRef.current = null;
    isStartingRef.current = false;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('[useSpeechRecognition] Error during abort():', e);
      }
    }

    isRunningRef.current = false;
    setIsListening(false);
    setIsUserSpeaking(false);
    setInterimTranscript('');
  }, []);

  const startListening = useCallback(
    (options: { lang?: string } = {}) => {
      if (!isSupported) {
        const msg = 'Speech recognition is not supported in this browser. Please use Google Chrome or Microsoft Edge.';
        setError(msg);
        callbacksRef.current.onError?.(msg, true);
        return;
      }

      if (!isComponentMountedRef.current) {
        return;
      }

      // STATE GUARD: Never start while AI is speaking or processing a command
      if (callbacksRef.current.isAISpeaking?.() || callbacksRef.current.isProcessing?.()) {
        console.log('[useSpeechRecognition] ⛔ Refusing start: AI is speaking or processing');
        return;
      }

      // Check if already active or currently starting
      if (isRunningRef.current || isStartingRef.current) {
        console.log('[useSpeechRecognition] Recognition already running or starting. Ignoring redundant start()');
        return;
      }

      // If an old instance is still wrapping up (abort/stop pending onend), queue the start
      if (recognitionRef.current) {
        console.log('[useSpeechRecognition] Previous instance still shutting down; queuing start');
        pendingStartRef.current = options;
        return;
      }

      isExplicitlyStoppedRef.current = false;
      isStartingRef.current = true;
      setError(null);
      setInterimTranscript('');

      try {
        const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognitionClass();
        recognitionRef.current = recognition;

        // Discrete single-turn mode: works natively across Android Chrome and Desktop Chrome
        // Captures user speech -> yields final transcript -> stops cleanly -> AI processes
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = options.lang || 'en-IN';

        recognition.onstart = () => {
          // Guard: If AI started speaking between request and onstart, abort immediately
          if (callbacksRef.current.isAISpeaking?.() || callbacksRef.current.isProcessing?.()) {
            console.log('[useSpeechRecognition] ⛔ onstart aborted: AI started speaking or processing');
            try {
              recognition.abort();
            } catch {}
            return;
          }

          console.log('[useSpeechRecognition] 🎤 recognition.onstart: Microphone is LIVE and LISTENING!');
          isStartingRef.current = false;
          isRunningRef.current = true;
          setIsListening(true);
          setError(null);
          callbacksRef.current.onStart?.();
        };

        recognition.onspeechstart = () => {
          if (callbacksRef.current.isAISpeaking?.()) return;
          console.log('[useSpeechRecognition] 🗣️ User began speaking');
          setIsUserSpeaking(true);
          callbacksRef.current.onSpeechStart?.();
        };

        recognition.onspeechend = () => {
          console.log('[useSpeechRecognition] 🤫 User finished speaking');
          setIsUserSpeaking(false);
          callbacksRef.current.onSpeechEnd?.();
        };

        recognition.onresult = (event: any) => {
          // Safeguard: Never process audio if AI is speaking
          if (callbacksRef.current.isAISpeaking?.()) {
            console.log('[useSpeechRecognition] Discarded onresult: AI is speaking');
            setInterimTranscript('');
            return;
          }

          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const item = event.results[i];
            if (item.isFinal) {
              final += item[0].transcript;
            } else {
              interim += item[0].transcript;
            }
          }

          if (interim) {
            setInterimTranscript(interim);
            callbacksRef.current.onInterimTranscript?.(interim);
          }

          if (final && final.trim()) {
            const trimmedFinal = final.trim();
            console.log(`[useSpeechRecognition] 📝 Final result captured: "${trimmedFinal}"`);
            setTranscript((prev) => (prev ? `${prev} ${trimmedFinal}` : trimmedFinal));
            setInterimTranscript('');

            // CRITICAL: Immediately stop recognition after receiving user's final input!
            isExplicitlyStoppedRef.current = true;
            try {
              recognition.stop();
            } catch {}

            callbacksRef.current.onFinalTranscript?.(trimmedFinal);
          }
        };

        recognition.onerror = (event: any) => {
          const errType = event.error;
          console.warn(`[useSpeechRecognition] ⚠️ recognition.onerror: "${errType}"`);
          isStartingRef.current = false;

          // 'no-speech' is non-fatal: user simply stayed silent during the turn
          if (errType === 'no-speech') {
            callbacksRef.current.onNoSpeech?.();
            return;
          }

          // 'aborted' is fired when we deliberately stop/abort recognition
          if (errType === 'aborted') {
            return;
          }

          let errorMsg = `Speech recognition error: ${errType}`;
          let isFatal = false;

          switch (errType) {
            case 'not-allowed':
              errorMsg = 'Microphone permission was denied. Please allow microphone access in your browser settings (and ensure you are on HTTPS or localhost).';
              isFatal = true;
              isExplicitlyStoppedRef.current = true;
              break;
            case 'audio-capture':
              errorMsg = 'No microphone was detected on your device or the microphone is busy in another application.';
              isFatal = true;
              isExplicitlyStoppedRef.current = true;
              break;
            case 'network':
              errorMsg = 'Network error during speech recognition. Please check your internet connection.';
              isFatal = false;
              break;
            default:
              isFatal = false;
              break;
          }

          setError(errorMsg);
          callbacksRef.current.onError?.(errorMsg, isFatal);
        };

        recognition.onend = () => {
          console.log('[useSpeechRecognition] 🛑 recognition.onend: Session ended');
          isStartingRef.current = false;
          isRunningRef.current = false;
          setIsListening(false);
          setIsUserSpeaking(false);
          recognitionRef.current = null;

          // If a restart was pending, trigger it cleanly now
          if (
            pendingStartRef.current &&
            !callbacksRef.current.isAISpeaking?.() &&
            !callbacksRef.current.isProcessing?.()
          ) {
            const nextOptions = pendingStartRef.current;
            pendingStartRef.current = null;
            console.log('[useSpeechRecognition] 🔄 Executing queued startListening()...');
            startListening(nextOptions);
            return;
          }

          // If not explicitly stopped and component is still mounted, notify parent
          if (!isExplicitlyStoppedRef.current && isComponentMountedRef.current) {
            callbacksRef.current.onEnd?.();
          }
        };

        console.log('[useSpeechRecognition] 🚀 Calling recognition.start()...');
        recognition.start();
      } catch (err: any) {
        console.error('[useSpeechRecognition] ❌ Exception in recognition.start():', err);
        isStartingRef.current = false;
        isRunningRef.current = false;
        setIsListening(false);
        setIsUserSpeaking(false);
        recognitionRef.current = null;

        const msg = err.message || 'Failed to start microphone';
        setError(msg);
        callbacksRef.current.onError?.(msg, false);
      }
    },
    [isSupported]
  );

  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      isExplicitlyStoppedRef.current = true;
      pendingStartRef.current = null;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    isUserSpeaking,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
  };
}
