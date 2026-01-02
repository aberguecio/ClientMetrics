import { openai, MODELS } from './openai';
import { buildCategorizationPrompt } from './prompts';
import { AnalysisSchema, type Analysis, type CategorizationParams } from '@/types/llm';


/**
 * Retry logic wrapper for categorization with exponential backoff
 */
export async function categorizeMeetingWithRetry(
  params: CategorizationParams,
  maxRetries: number = 3
): Promise<Analysis> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await categorizeMeeting(params);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Don't retry on validation errors
      if (lastError.message.includes('Invalid type') || lastError.message.includes('Expected')) {
        throw lastError;
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to categorize meeting after retries');
}
