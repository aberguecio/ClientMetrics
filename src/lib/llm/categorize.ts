import { getOpenAIOrThrow, MODELS } from './openai';
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


async function categorizeMeeting(params: CategorizationParams): Promise<Analysis> {
  try {
    const prompt = buildCategorizationPrompt({
      clientName: params.clientName,
      salesRep: params.salesRep,
      meetingDate: params.meetingDate,
      closed: params.closed,
      transcript: params.transcript,
    });
    const openai = getOpenAIOrThrow();
    const response = await openai.chat.completions.create({
      model: MODELS.LLM,
      messages: [
        {
          role: 'system',
          content: 'You are an expert sales analyst. Respond only with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 1, // Lower temperature for more consistent results
    });
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }
    // Parse and validate the JSON response
    const json = JSON.parse(content);
    const validated = AnalysisSchema.parse(json);
    return validated;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to categorize meeting: ${error.message}`);
    }
    throw new Error('Failed to categorize meeting: Unknown error');
  }
}