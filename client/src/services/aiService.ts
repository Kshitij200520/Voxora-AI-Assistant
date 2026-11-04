import { api } from './api';
import { ActionItem, ExecutionResponse, ServerHealth } from '../types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const aiService = {
  getHealth: async () => {
    return api.get<ServerHealth>('/health');
  },

  interpretVoice: async (params: {
    text: string;
    userTimezone?: string;
    referenceDate?: string;
    language?: string;
    conversationHistory?: ChatMessage[];
  }) => {
    return api.post<{
      success: boolean;
      data?: {
        actions: ActionItem[];
        response: string;
        detectedLanguage: 'en' | 'hi' | 'hinglish';
      };
      error?: string;
    }>('/ai/interpret', params);
  },

  executeActions: async (params: {
    actions: ActionItem[];
    confirmed?: boolean;
    language?: string;
  }) => {
    return api.post<{
      success: boolean;
      data?: ExecutionResponse;
      error?: string;
    }>('/actions/execute', params);
  },
};
