import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY environment variable is not set');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Models configuration
export const MODELS = {
  LLM: 'gpt-5-mini',
  EMBEDDING: 'text-embedding-3-small',
} as const;
