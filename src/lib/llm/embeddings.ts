import { openai, MODELS } from './openai';

/**
 * Generate embeddings for a text using OpenAI
 * Returns a 1536-dimensional vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Truncate text if too long (max ~8000 tokens for text-embedding-3-small)
    const maxChars = 30000; // Approximate limit
    const truncatedText = text.length > maxChars ? text.substring(0, maxChars) : text;

    const response = await openai.embeddings.create({
      model: MODELS.EMBEDDING,
      input: truncatedText,
      encoding_format: 'float',
    });

    const embedding = response.data[0]?.embedding;

    if (!embedding) {
      throw new Error('No embedding returned from OpenAI');
    }

    return embedding;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to generate embedding: ${error.message}`);
    }
    throw new Error('Failed to generate embedding: Unknown error');
  }
}

/**
 * Build embedding text from meeting data and analysis
 */
export function buildEmbeddingText(params: {
  clientName: string;
  transcript: string;
  analysis?: any;
}): string {
  const parts = [
    `Client: ${params.clientName}`,
    `Transcript: ${params.transcript}`,
  ];

  if (params.analysis) {
    // Add key analysis fields to improve semantic search
    if (params.analysis.pain_points?.length > 0) {
      parts.push(`Pain Points: ${params.analysis.pain_points.join(', ')}`);
    }
    if (params.analysis.use_cases?.length > 0) {
      parts.push(`Use Cases: ${params.analysis.use_cases.join(', ')}`);
    }
    if (params.analysis.objections?.length > 0) {
      parts.push(`Objections: ${params.analysis.objections.join(', ')}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Retry logic wrapper for embedding generation
 */
export async function generateEmbeddingWithRetry(
  text: string,
  maxRetries: number = 3
): Promise<number[]> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await generateEmbedding(text);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Failed to generate embedding after retries');
}
