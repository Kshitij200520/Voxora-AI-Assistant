import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  VoiceState,
  ActionItem,
  ActionResult,
  ExecutionResponse,
  ConversationMessage,
} from '../types';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '../hooks/useSpeechSynthesis';
import { aiService, ChatMessage } from '../services/aiService';
import { useSettings } from './SettingsContext';

interface ConfirmationRequest {
  action: ActionItem;
  message: string;
  details?: any;
}

interface VoiceContextType {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  detectedActions: ActionItem[];
  executionResults: ActionResult[];
  spokenResponse: string;
  isListening: boolean;
  isSpeaking: boolean;
  isSessionActive: boolean;
  sessionId: string;
  conversationMessages: ConversationMessage[];
  sessionDuration: number;
  confirmationRequest: ConfirmationRequest | null;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  startSession: () => void;
  endSession: () => void;
  toggleSession: () => void;
  processTextInput: (text: string) => Promise<void>;
  confirmAction: () => Promise<void>;
  cancelConfirmation: () => void;
  stopSpeaking: () => void;
  retry: () => void;
  clearConversation: () => void;
  // Legacy aliases
  startVoiceInput: () => void;
  stopVoiceInput: () => void;
  resetAll: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

const EXIT_COMMANDS = [
  'end conversation',
  'stop conversation',
  'end session',
  'stop session',
  'stop listening',
  'bye',
  'goodbye',
  'exit',
  'alvida',
  'band karo',
  'khatam karo',
];

export const VoiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language, autoSpeak, speechRate } = useSettings();

  const [state, setState] = useState<VoiceState>('IDLE');
  const [error, setError] = useState<string | null>(null);
  const [detectedActions, setDetectedActions] = useState<ActionItem[]>([]);
  const [executionResults, setExecutionResults] = useState<ActionResult[]>([]);
  const [spokenResponse, setSpokenResponse] = useState<string>('');
  const [confirmationRequest, setConfirmationRequest] = useState<ConfirmationRequest | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Continuous Session States
  const [sessionId, setSessionId] = useState<string>(() => `sess_${Date.now()}`);
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  // Technical Lifecycle Refs (ensuring zero stale closures & synchronized states)
  const voiceSessionActiveRef = useRef<boolean>(false);
  const isAISpeakingRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const isAwaitingConfirmationRef = useRef<boolean>(false);
  const isComponentMountedRef = useRef<boolean>(true);
  const currentLanguageRef = useRef<string>(language);
  const conversationMessagesRef = useRef<ConversationMessage[]>([]);
  const retryCountRef = useRef<number>(0);
  const lastProcessedTextRef = useRef<string>('');
  const restartTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Forward declarations
  const handleFinalTranscriptRef = useRef<(text: string) => Promise<void>>(async () => {});
  const safeRestartMicRef = useRef<() => void>(() => {});

  // Keep refs in sync
  useEffect(() => {
    currentLanguageRef.current = language;
  }, [language]);

  useEffect(() => {
    conversationMessagesRef.current = conversationMessages;
  }, [conversationMessages]);

  useEffect(() => {
    isComponentMountedRef.current = true;
    return () => {
      isComponentMountedRef.current = false;
      if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  const { speak, stop: stopSpeech, isSpeaking } = useSpeechSynthesis();

  // Session duration ticker
  useEffect(() => {
    if (isSessionActive) {
      sessionTimerRef.current = setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setSessionDuration(0);
    }

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, [isSessionActive]);

  // Integrated Web Speech Recognition hook
  const {
    isListening,
    isUserSpeaking,
    transcript,
    interimTranscript,
    error: speechError,
    startListening,
    stopListening,
    abortListening,
    resetTranscript,
  } = useSpeechRecognition({
    onStart: () => {
      // RULE: Set isListening TRUE and state to 'LISTENING' only when recognition.onstart actually fires!
      console.log('[VoiceContext] 🎙️ recognition.onstart confirmed! Setting state to LISTENING');
      if (voiceSessionActiveRef.current && !isAISpeakingRef.current && !isProcessingRef.current) {
        setState('LISTENING');
        setError(null);
        retryCountRef.current = 0;
      }
    },
    onSpeechStart: () => {
      console.log('[VoiceContext] 🗣️ User speech started');
      if (voiceSessionActiveRef.current && !isAISpeakingRef.current && !isProcessingRef.current) {
        setState('USER_SPEAKING');
      }
    },
    onSpeechEnd: () => {
      console.log('[VoiceContext] 🤫 User speech paused');
    },
    onFinalTranscript: (finalText: string) => {
      console.log(`[VoiceContext] 🎯 Final transcript captured: "${finalText}"`);
      handleFinalTranscriptRef.current(finalText);
    },
    onEnd: () => {
      console.log('[VoiceContext] 🛑 recognition.onend event received');
      // If voice session is active, component mounted, and AI is neither speaking nor processing:
      // Chrome disconnected due to silence timeout. Restart safely.
      if (
        voiceSessionActiveRef.current &&
        isComponentMountedRef.current &&
        !isAISpeakingRef.current &&
        !isProcessingRef.current &&
        !isAwaitingConfirmationRef.current
      ) {
        console.log('[VoiceContext] 🔄 Browser silence timeout; restarting recognition...');
        safeRestartMicRef.current();
      }
    },
    onError: (err: string, isFatal: boolean) => {
      console.warn(`[VoiceContext] ⚠️ Speech recognition error (fatal=${isFatal}): ${err}`);
      if (isFatal) {
        setError(err);
        setState('ERROR');
        endSession();
      } else {
        // Non-fatal error (e.g. temporary network drop) -> try reconnecting
        if (voiceSessionActiveRef.current && !isAISpeakingRef.current) {
          safeRestartMicRef.current();
        }
      }
    },
  });

  // Safe restart mechanism with bounded retries and accurate RESTARTING state
  safeRestartMicRef.current = () => {
    if (!voiceSessionActiveRef.current || !isComponentMountedRef.current) {
      console.log('[VoiceContext] safeRestartMic skipped: session not active or unmounted');
      return;
    }

    if (isAISpeakingRef.current || isProcessingRef.current) {
      console.log('[VoiceContext] safeRestartMic skipped: AI is currently speaking or processing');
      return;
    }

    if (retryCountRef.current >= 5) {
      console.error('[VoiceContext] Maximum restart attempts exceeded (5).');
      setError('Microphone disconnected. Please click the mic to reconnect.');
      setState('ERROR');
      return;
    }

    retryCountRef.current += 1;
    setState('RESTARTING'); // Show "Reconnecting microphone..." while restarting

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }

    restartTimerRef.current = setTimeout(() => {
      if (
        voiceSessionActiveRef.current &&
        isComponentMountedRef.current &&
        !isAISpeakingRef.current &&
        !isProcessingRef.current
      ) {
        console.log(`[VoiceContext] 🚀 Attempting mic restart (try #${retryCountRef.current})...`);
        startListening({ lang: currentLanguageRef.current });
      }
    }, 200);
  };

  // Safe restart of speech recognition after AI response finishes speaking
  const resumeListeningAfterAi = useCallback(() => {
    console.log('[VoiceContext] 🔄 resumeListeningAfterAi called');
    if (!voiceSessionActiveRef.current || !isComponentMountedRef.current) {
      console.log('[VoiceContext] Session inactive or unmounted; skipping resume.');
      return;
    }

    isAISpeakingRef.current = false;
    isProcessingRef.current = false;
    retryCountRef.current = 0;
    lastProcessedTextRef.current = ''; // Reset so user can speak similar or repeated commands!
    resetTranscript();

    // Set state to RESTARTING (amber) until recognition.onstart fires
    setState('RESTARTING');

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
    }

    // Allow 200ms audio buffer clearance for device output to switch back to input
    restartTimerRef.current = setTimeout(() => {
      if (
        voiceSessionActiveRef.current &&
        isComponentMountedRef.current &&
        !isAISpeakingRef.current &&
        !isProcessingRef.current
      ) {
        console.log('[VoiceContext] 🎙️ Calling startListening() after AI response completed...');
        startListening({ lang: currentLanguageRef.current });
      }
    }, 200);
  }, [resetTranscript, startListening]);

  // Session Initiation
  const startSession = useCallback(() => {
    console.log('[VoiceContext] ▶️ Starting continuous voice session...');
    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    const newId = `sess_${Date.now()}`;
    setSessionId(newId);
    setIsSessionActive(true);
    voiceSessionActiveRef.current = true;
    isAISpeakingRef.current = false;
    isProcessingRef.current = false;
    isAwaitingConfirmationRef.current = false;
    retryCountRef.current = 0;
    lastProcessedTextRef.current = '';

    setError(null);
    setDetectedActions([]);
    setExecutionResults([]);
    setSpokenResponse('');
    setConfirmationRequest(null);
    resetTranscript();

    setState('STARTING');
    setIsModalOpen(true);

    // Call startListening immediately (state will change to LISTENING once onstart fires)
    setTimeout(() => {
      if (voiceSessionActiveRef.current && isComponentMountedRef.current) {
        startListening({ lang: currentLanguageRef.current });
      }
    }, 100);
  }, [resetTranscript, startListening]);

  // Session Termination
  const endSession = useCallback(() => {
    console.log('[VoiceContext] ⏹️ Ending voice session...');
    voiceSessionActiveRef.current = false;
    isAISpeakingRef.current = false;
    isProcessingRef.current = false;
    isAwaitingConfirmationRef.current = false;

    if (restartTimerRef.current) {
      clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }

    setIsSessionActive(false);
    abortListening();
    stopSpeech();
    setState('STOPPED');
  }, [abortListening, stopSpeech]);

  const toggleSession = useCallback(() => {
    if (voiceSessionActiveRef.current) {
      endSession();
    } else {
      startSession();
    }
  }, [startSession, endSession]);

  // Process text through AI
  const processText = useCallback(
    async (text: string) => {
      if (!text || text.trim().length === 0) return;

      const trimmedText = text.trim();
      console.log(`[VoiceContext] 🧠 Processing text command: "${trimmedText}"`);

      // Check verbal exit command
      const lower = trimmedText.toLowerCase();
      const isExit = EXIT_COMMANDS.some((cmd) => lower === cmd || lower.startsWith(cmd));
      if (isExit) {
        const farewellMessage =
          language === 'hi-IN'
            ? 'Voice conversation band ho gaya hai. Aapka din shubh ho!'
            : 'Voice session ended. Have a great day!';

        const exitUserMsg: ConversationMessage = {
          id: `msg_u_${Date.now()}`,
          role: 'user',
          content: trimmedText,
          timestamp: new Date().toLocaleTimeString(),
        };

        const exitAiMsg: ConversationMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content: farewellMessage,
          timestamp: new Date().toLocaleTimeString(),
        };

        setConversationMessages((prev) => [...prev, exitUserMsg, exitAiMsg]);
        setSpokenResponse(farewellMessage);

        speak(farewellMessage, {
          lang: language,
          rate: speechRate,
          onEnd: () => endSession(),
        });

        endSession();
        return;
      }

      // CRITICAL: Stop recognition cleanly so AI audio is never captured by microphone
      stopListening();
      isProcessingRef.current = true;
      setState('PROCESSING');
      setError(null);

      // Add user message to conversation list
      const userMessage: ConversationMessage = {
        id: `msg_u_${Date.now()}`,
        role: 'user',
        content: trimmedText,
        timestamp: new Date().toLocaleTimeString(),
      };

      setConversationMessages((prev) => [...prev, userMessage]);

      try {
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
        const referenceDate = new Date().toISOString();

        // Build history for backend LLM
        const historyPayload: ChatMessage[] = conversationMessagesRef.current
          .slice(-10)
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        const aiResponse = await aiService.interpretVoice({
          text: trimmedText,
          userTimezone: timezone,
          referenceDate,
          language: language.startsWith('hi') ? 'hi' : 'en',
          conversationHistory: historyPayload,
        });

        if (!aiResponse.success || !aiResponse.data) {
          throw new Error(aiResponse.error || 'Failed to interpret voice command');
        }

        const { actions, response: aiMessage } = aiResponse.data;
        setDetectedActions(actions);
        setSpokenResponse(aiMessage);

        const isChatOnly =
          !actions ||
          actions.length === 0 ||
          actions.every((a) => a.type === 'CHAT' || a.type === 'UNKNOWN');

        if (isChatOnly) {
          // Record assistant response
          const assistantMessage: ConversationMessage = {
            id: `msg_a_${Date.now()}`,
            role: 'assistant',
            content: aiMessage,
            timestamp: new Date().toLocaleTimeString(),
          };
          setConversationMessages((prev) => [...prev, assistantMessage]);

          if (autoSpeak && aiMessage) {
            setState('AI_SPEAKING');
            isAISpeakingRef.current = true;
            isProcessingRef.current = false;
            speak(aiMessage, {
              lang: language,
              rate: speechRate,
              onEnd: () => {
                resumeListeningAfterAi();
              },
              onError: () => {
                resumeListeningAfterAi();
              },
            });
          } else {
            isProcessingRef.current = false;
            resumeListeningAfterAi();
          }
          return;
        }

        // Check if any destructive action requires confirmation
        const pendingConfirmAction = actions.find((a) => a.requiresConfirmation);

        if (pendingConfirmAction) {
          setState('AWAITING_CONFIRMATION');
          isAwaitingConfirmationRef.current = true;
          setConfirmationRequest({
            action: pendingConfirmAction,
            message: pendingConfirmAction.confirmationMessage || 'Please confirm this action.',
            details: pendingConfirmAction.payload,
          });

          const confirmMsg =
            pendingConfirmAction.confirmationMessage ||
            'Are you sure you want to proceed with this destructive action?';
          setSpokenResponse(confirmMsg);

          const assistantConfirmMsg: ConversationMessage = {
            id: `msg_a_${Date.now()}`,
            role: 'assistant',
            content: confirmMsg,
            timestamp: new Date().toLocaleTimeString(),
            actions,
          };
          setConversationMessages((prev) => [...prev, assistantConfirmMsg]);

          if (autoSpeak) {
            setState('AI_SPEAKING');
            isAISpeakingRef.current = true;
            isProcessingRef.current = false;
            speak(confirmMsg, {
              lang: language,
              rate: speechRate,
              onEnd: () => {
                resumeListeningAfterAi();
              },
            });
          } else {
            isProcessingRef.current = false;
            resumeListeningAfterAi();
          }
          return;
        }

        // Execute non-destructive actions immediately
        await executeConfirmedActions(actions, false, trimmedText);
      } catch (err: any) {
        console.error('Error processing command:', err);
        const errMsg = err.message || 'An error occurred while understanding your voice command.';
        setError(errMsg);
        setState('ERROR');
        isProcessingRef.current = false;

        const errorAssistantMsg: ConversationMessage = {
          id: `msg_a_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, I had trouble processing that request.',
          timestamp: new Date().toLocaleTimeString(),
        };
        setConversationMessages((prev) => [...prev, errorAssistantMsg]);

        if (autoSpeak) {
          setState('AI_SPEAKING');
          isAISpeakingRef.current = true;
          speak('Sorry, there was an issue processing your request.', {
            lang: language,
            rate: speechRate,
            onEnd: () => resumeListeningAfterAi(),
          });
        } else {
          resumeListeningAfterAi();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, autoSpeak, speechRate, resumeListeningAfterAi, speak, stopListening, endSession]
  );

  const executeConfirmedActions = async (
    actionsToExecute: ActionItem[],
    confirmed: boolean,
    originalText?: string
  ) => {
    try {
      setState('EXECUTING');

      const result = await aiService.executeActions({
        actions: actionsToExecute,
        confirmed,
        language,
      });

      if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to execute actions on database');
      }

      const executionData: ExecutionResponse = result.data;
      setExecutionResults(executionData.results);
      setSpokenResponse(executionData.spokenResponse);

      // Trigger automatic dashboard refresh
      window.dispatchEvent(new Event('voxora:refresh'));

      // Add to conversation stream
      const assistantMessage: ConversationMessage = {
        id: `msg_a_${Date.now()}`,
        role: 'assistant',
        content: executionData.spokenResponse,
        timestamp: new Date().toLocaleTimeString(),
        actions: actionsToExecute,
        results: executionData.results,
      };
      setConversationMessages((prev) => [...prev, assistantMessage]);

      if (autoSpeak && executionData.spokenResponse) {
        setState('AI_SPEAKING');
        isAISpeakingRef.current = true;
        isProcessingRef.current = false;
        speak(executionData.spokenResponse, {
          lang: language,
          rate: speechRate,
          onEnd: () => {
            resumeListeningAfterAi();
          },
          onError: () => {
            resumeListeningAfterAi();
          },
        });
      } else {
        isProcessingRef.current = false;
        resumeListeningAfterAi();
      }
    } catch (err: any) {
      console.error('Action execution error:', err);
      const errMsg = err.message || 'Failed to execute database action.';
      setError(errMsg);
      setState('ERROR');
      isProcessingRef.current = false;

      if (autoSpeak) {
        setState('AI_SPEAKING');
        isAISpeakingRef.current = true;
        speak('Error: The operation could not be saved to the database.', {
          lang: language,
          rate: speechRate,
          onEnd: () => resumeListeningAfterAi(),
        });
      } else {
        resumeListeningAfterAi();
      }
    }
  };

  // Wire up final transcript handler
  handleFinalTranscriptRef.current = async (finalText: string) => {
    if (!finalText || finalText.trim() === lastProcessedTextRef.current) return;

    // Check if user is confirming a pending destructive action verbally
    if (isAwaitingConfirmationRef.current && confirmationRequest) {
      const lower = finalText.toLowerCase();
      if (lower.includes('yes') || lower.includes('confirm') || lower.includes('delete') || lower.includes('haan')) {
        lastProcessedTextRef.current = finalText.trim();
        confirmAction();
        return;
      } else if (lower.includes('no') || lower.includes('cancel') || lower.includes('nahi') || lower.includes('mat')) {
        lastProcessedTextRef.current = finalText.trim();
        cancelConfirmation();
        return;
      }
    }

    lastProcessedTextRef.current = finalText.trim();
    await processText(finalText.trim());
  };

  const confirmAction = async () => {
    if (!confirmationRequest) return;
    const actionsToExecute =
      detectedActions.length > 0 ? detectedActions : [confirmationRequest.action];
    setConfirmationRequest(null);
    isAwaitingConfirmationRef.current = false;
    await executeConfirmedActions(actionsToExecute, true);
  };

  const cancelConfirmation = () => {
    setConfirmationRequest(null);
    isAwaitingConfirmationRef.current = false;
    const cancelMsg = 'Action canceled. No changes were made.';
    setSpokenResponse(cancelMsg);

    const cancelAssistantMsg: ConversationMessage = {
      id: `msg_a_${Date.now()}`,
      role: 'assistant',
      content: cancelMsg,
      timestamp: new Date().toLocaleTimeString(),
    };
    setConversationMessages((prev) => [...prev, cancelAssistantMsg]);

    if (autoSpeak) {
      setState('AI_SPEAKING');
      isAISpeakingRef.current = true;
      speak(cancelMsg, {
        lang: language,
        rate: speechRate,
        onEnd: () => resumeListeningAfterAi(),
      });
    } else {
      resumeListeningAfterAi();
    }
  };

  const stopSpeaking = () => {
    stopSpeech();
    isAISpeakingRef.current = false;
    resumeListeningAfterAi();
  };

  const retry = () => {
    if (transcript) {
      processText(transcript);
    } else {
      startSession();
    }
  };

  const clearConversation = () => {
    setConversationMessages([]);
    resetTranscript();
    setDetectedActions([]);
    setExecutionResults([]);
    setSpokenResponse('');
    setError(null);
  };

  // Backward compatibility alias methods
  const startVoiceInput = () => startSession();
  const stopVoiceInput = () => endSession();
  const resetAll = () => clearConversation();

  return (
    <VoiceContext.Provider
      value={{
        state,
        transcript,
        interimTranscript,
        error: error || speechError,
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
        isModalOpen,
        openModal: () => setIsModalOpen(true),
        closeModal: () => setIsModalOpen(false),
        startSession,
        endSession,
        toggleSession,
        processTextInput: processText,
        confirmAction,
        cancelConfirmation,
        stopSpeaking,
        retry,
        clearConversation,
        startVoiceInput,
        stopVoiceInput,
        resetAll,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
};

export const useVoice = (): VoiceContextType => {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
};
