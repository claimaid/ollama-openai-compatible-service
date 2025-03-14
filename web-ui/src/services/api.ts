import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface Model {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface ModelListResponse {
  object: string;
  data: Model[];
}

export const api = {
  // Get list of available models
  getModels: async (): Promise<Model[]> => {
    const response = await apiClient.get<ModelListResponse>('/v1/models');
    return response.data.data;
  },

  // Generate chat completion
  createChatCompletion: async (request: ChatCompletionRequest): Promise<ChatCompletionResponse> => {
    const response = await apiClient.post<ChatCompletionResponse>('/v1/chat/completions', request);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string; version: string }> => {
    const response = await apiClient.get('/health');
    return response.data;
  },
};