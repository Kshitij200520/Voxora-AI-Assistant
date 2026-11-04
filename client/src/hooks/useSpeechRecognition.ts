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
  onError?: (error: string, isFatal: boolean) => void;
  isAISpeaking?: () => boolean;
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
  const isRecognitionRunningRef = useRef<boolean>(false);
  const isRecognitionStartingRef = useRef<boolean>(false);
  const isManuallyStoppedRef = useRef<boolean>(true);
  const isComponentMountedRef = useRef<boolean>(true);
  const callbacksRef = useRef<UseSpeechRecognitionCallbacks>({});
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize callbacks
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

  const abortListening = useCallback(() => {
    console.log('[useSpeechRecognition] ⏹️ abortListening called');
    isManuallyStoppedRef.current = true;
    isRecognitionStartingRef.current = false;
    isRecognitionRunningRef.current = false;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        // Detach all listeners before aborting so no pending audio buffers fire callbacks
        recognitionRef.current.onstart = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.onspeechstart = null;
        recognitionRef.current.onspeechend = null;
        recognitionRef.current.abort();
      } catch (e) {
        console.warn('[useSpeechRecognition] Error during abort:', e);
      }
      recognitionRef.current = null;
    }

    setIsListening(false);
    setIsUserSpeaking(false);
    setInterimTranscript('');
  }, []);

  const stopListening = useCallback(() => {
    console.log('[useSpeechRecognition] ⏸️ stopListening called');
    isManuallyStoppedRef.current = true;
    isRecognitionStartingRef.current = false;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('[useSpeechRecognition] Error during stop:', e);
      }
    }

    // Let onend update isListening & isRecognitionRunningRef
  }, []);

  const startListening = useCallback(
    (options: { lang?: string } = {}) => {
      if (!isSupported) {
        const msg = 'Speech recognition is not supported in this browser. Please use Chrome or Edge.';
        setError(msg);
        callbacksRef.current.onError?.(msg, true);
        return;
      }

      if (!isComponentMountedRef.current) {
        return;
      }

      // Never start speech recognition while AI is playing voice
      if (callbacksRef.current.isAISpeaking?.()) {
        console.log('[AUDIO] Cannot start recognition while AI is speaking');
        return;
      }

      // Avoid duplicate starts if already running or currently starting
      if (isRecognitionRunningRef.current || isRecognitionStartingRef.current) {
        console.log('[useSpeechRecognition] Recognition already running or starting. Skipping start().');
        return;
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      isManuallyStoppedRef.current = false;
      isRecognitionStartingRef.current = true;
      setError(null);
      setInterimTranscript('');

      try {
        // Clean up any stale recognition reference
        if (recognitionRef.current) {
          try {
            recognitionRef.current.onstart = null;
            recognitionRef.current.onend = null;
            recognitionRef.current.onerror = null;
            recognitionRef.current.onresult = null;
            recognitionRef.current.abort();
          } catch {
            // Ignored
          }
          recognitionRef.current = null;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        // Web Speech API configuration
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;
        recognition.lang = options.lang || 'en-IN';

        recognition.onstart = () => {
          if (callbacksRef.current.isAISpeaking?.()) {
            console.log('[AUDIO] Ignoring recognition during AI playback (onstart)');
            try {
              recognition.abort();
            } catch {}
            return;
          }
          console.log('[useSpeechRecognition] 🎤 recognition.onstart: Microphone is ACTUALLY listening!');
          isRecognitionStartingRef.current = false;
          isRecognitionRunningRef.current = true;
          setIsListening(true);
          setError(null);
          callbacksRef.current.onStart?.();
        };

        recognition.onspeechstart = () => {
          if (callbacksRef.current.isAISpeaking?.()) {
            console.log('[AUDIO] Ignoring recognition during AI playback (onspeechstart)');
            return;
          }
          console.log('[useSpeechRecognition] 🗣️ recognition.onspeechstart: User started speaking');
          setIsUserSpeaking(true);
          callbacksRef.current.onSpeechStart?.();
        };

        recognition.onspeechend = () => {
          if (callbacksRef.current.isAISpeaking?.()) {
            return;
          }
          console.log('[useSpeechRecognition] 🤫 recognition.onspeechend: User stopped speaking');
          setIsUserSpeaking(false);
          callbacksRef.current.onSpeechEnd?.();
        };

        recognition.onresult = (event: any) => {
          // Strict echo safeguard: ignore any recognition callbacks during AI playback
          if (callbacksRef.current.isAISpeaking?.()) {
            console.log('[AUDIO] Ignoring recognition during AI playback (onresult)');
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
            console.log(`[useSpeechRecognition] 📝 recognition.onresult: final="${trimmedFinal}"`);
            setTranscript((prev) => (prev ? `${prev} ${trimmedFinal}` : trimmedFinal));
            setInterimTranscript('');
            callbacksRef.current.onFinalTranscript?.(trimmedFinal);
          }
        };

        recognition.onerror = (event: any) => {
          const errType = event.error;
          console.warn(`[useSpeechRecognition] ⚠️ recognition.onerror: "${errType}"`);
          isRecognitionStartingRef.current = false;

          // 'no-speech' is non-fatal in continuous conversational mode
          if (errType === 'no-speech') {
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
              errorMsg = 'Microphone permission was denied. Please allow microphone access.';
              isFatal = true;
              isManuallyStoppedRef.current = true;
              break;
            case 'audio-capture':
              errorMsg = 'No microphone was detected on your device.';
              isFatal = true;
              isManuallyStoppedRef.current = true;
              break;
            case 'network':
              errorMsg = 'Network error occurred during speech recognition.';
              isFatal = false;
              break;
          }

          setError(errorMsg);
          callbacksRef.current.onError?.(errorMsg, isFatal);
        };

        recognition.onend = () => {
          console.log('[useSpeechRecognition] 🛑 recognition.onend: SpeechRecognition session closed');
          isRecognitionStartingRef.current = false;
          isRecognitionRunningRef.current = false;
          setIsListening(false);
          setIsUserSpeaking(false);

          // If AI is currently speaking, do NOT auto-restart here (AI onEnd will resume with recovery delay)
          if (callbacksRef.current.isAISpeaking?.()) {
            console.log('[AUDIO] Recognition closed during AI playback; waiting for AI speech onEnd.');
            return;
          }

          // Inform parent for safe automatic reconnection if not manually stopped
          if (!isManuallyStoppedRef.current && isComponentMountedRef.current) {
            console.log('[useSpeechRecognition] 🔄 Not manually stopped; notifying onEnd for safe auto-restart');
            callbacksRef.current.onEnd?.();
          }
        };

        recognitionRef.current = recognition;
        console.log('[useSpeechRecognition] 🚀 Calling recognition.start()...');
        recognition.start();
      } catch (err: any) {
        console.error('[useSpeechRecognition] ❌ Exception during recognition.start():', err);
        isRecognitionStartingRef.current = false;
        isRecognitionRunningRef.current = false;
        setIsListening(false);
        setIsUserSpeaking(false);

        // Handle InvalidStateError (when previous recognition is still shutting down)
        if (err.name === 'InvalidStateError' || err.message?.includes('already started')) {
          console.warn('[useSpeechRecognition] Recognition transitioning, scheduling retry in 200ms...');
          retryTimeoutRef.current = setTimeout(() => {
            if (!isManuallyStoppedRef.current && isComponentMountedRef.current) {
              startListening(options);
            }
          }, 200);
          return;
        }

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
      isManuallyStoppedRef.current = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.onstart = null;
          recognitionRef.current.onend = null;
          recognitionRef.current.onerror = null;
          recognitionRef.current.onresult = null;
          recognitionRef.current.abort();
        } catch {
          // Ignored
        }
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
