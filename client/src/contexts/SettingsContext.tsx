import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ServerHealth } from '../types';
import { aiService } from '../services/aiService';
import { notificationService } from '../services/notificationService';

interface SettingsContextType {
  language: 'en-IN' | 'hi-IN';
  setLanguage: (lang: 'en-IN' | 'hi-IN') => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  autoSpeak: boolean;
  setAutoSpeak: (val: boolean) => void;
  health: ServerHealth | null;
  isCheckingHealth: boolean;
  refreshHealth: () => Promise<void>;
  notificationPermission: NotificationPermission;
  requestNotificationPermission: () => Promise<NotificationPermission>;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<'en-IN' | 'hi-IN'>(() => {
    return (localStorage.getItem('voxora_lang') as 'en-IN' | 'hi-IN') || 'en-IN';
  });

  const [speechRate, setSpeechRateState] = useState<number>(() => {
    return parseFloat(localStorage.getItem('voxora_speech_rate') || '1.0');
  });

  const [autoSpeak, setAutoSpeakState] = useState<boolean>(() => {
    return localStorage.getItem('voxora_auto_speak') !== 'false';
  });

  const [health, setHealth] = useState<ServerHealth | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    return notificationService.getPermission();
  });

  const setLanguage = (lang: 'en-IN' | 'hi-IN') => {
    setLanguageState(lang);
    localStorage.setItem('voxora_lang', lang);
  };

  const setSpeechRate = (rate: number) => {
    setSpeechRateState(rate);
    localStorage.setItem('voxora_speech_rate', String(rate));
  };

  const setAutoSpeak = (val: boolean) => {
    setAutoSpeakState(val);
    localStorage.setItem('voxora_auto_speak', String(val));
  };

  const refreshHealth = useCallback(async () => {
    setIsCheckingHealth(true);
    try {
      const data = await aiService.getHealth();
      setHealth(data);
    } catch (e) {
      console.warn('Health check failed:', e);
      setHealth({
        status: 'unreachable',
        app: 'VOXORA AI Backend',
        version: '1.0.0',
        uptimeSeconds: 0,
        database: {
          connected: false,
          state: 'disconnected',
          error: 'Backend API unreachable or server offline',
          lastChecked: new Date().toISOString(),
        },
        ai: {
          provider: 'Groq',
          model: 'unknown',
          configured: false,
        },
      });
    } finally {
      setIsCheckingHealth(false);
    }
  }, []);

  const requestNotificationPermission = async () => {
    const res = await notificationService.requestPermission();
    setNotificationPermission(res);
    return res;
  };

  useEffect(() => {
    refreshHealth();
    const interval = setInterval(refreshHealth, 30000); // 30s poll
    return () => clearInterval(interval);
  }, [refreshHealth]);

  return (
    <SettingsContext.Provider
      value={{
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
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

