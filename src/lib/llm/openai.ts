import OpenAI from 'openai';

// Lazily create the OpenAI client to avoid throwing at module import time
export function getOpenAI(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export function getOpenAIOrThrow(): OpenAI {
  const client = getOpenAI();
  if (!client) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return client;
}

// Models configuration
export const MODELS = {
  LLM: 'gpt-5-mini',
  EMBEDDING: 'text-embedding-3-small',
} as const;
