import { db } from '@/lib/db';
import { processingJobs, salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { categorizeMeetingWithRetry } from '@/lib/llm/categorize';
import { generateEmbeddingWithRetry, buildEmbeddingText } from '@/lib/llm/embeddings';
import { MODELS } from '@/lib/llm/openai';

const MAX_ATTEMPTS = 3;

/**
 * Create a new processing job for a meeting
 */
export async function createJob(meetingId: string) {
  const [job] = await db
    .insert(processingJobs)
    .values({
      meetingId,
      status: 'pending',
      attempts: 0,
    })
    .returning();

  return job;
}

/**
 * Create jobs for multiple meetings
 */
export async function createJobs(meetingIds: string[]) {
  const jobsData = meetingIds.map(meetingId => ({
    meetingId,
    status: 'pending' as const,
    attempts: 0,
  }));

  const jobs = await db
    .insert(processingJobs)
    .values(jobsData)
    .returning();

  return jobs;
}

/**
 * Internal function to process a specific job
 * Assumes job is already marked as 'processing'
 */
async function processJobInternal(job: { id: string; meetingId: string; attempts: number }): Promise<{ success: boolean; jobId?: string; error?: string }> {
  try {
    // 3. Get meeting data
    const [meeting] = await db
      .select()
      .from(salesMeetings)
      .where(eq(salesMeetings.id, job.meetingId))
      .limit(1);

    if (!meeting) {
      throw new Error('Meeting not found');
    }

    // 4. Categorize with LLM
    console.log(`Processing meeting ${meeting.id} - ${meeting.clientName}`);

    const analysis = await categorizeMeetingWithRetry({
      transcript: meeting.transcript,
      clientName: meeting.clientName,
      salesRep: meeting.salesRep,
      meetingDate: meeting.meetingDate,
      closed: meeting.closed,
    });

    console.log(`Analysis completed for meeting ${meeting.id}`);

    // 5. Generate embedding
    const embeddingText = buildEmbeddingText({
      clientName: meeting.clientName,
      transcript: meeting.transcript,
      analysis,
    });

    const embedding = await generateEmbeddingWithRetry(embeddingText);

    console.log(`Embedding generated for meeting ${meeting.id}`);

    // 6. Store analysis and embedding
    // Convert embedding array to pgvector format: [1,2,3] -> '[1,2,3]'
    const embeddingVector = `[${embedding.join(',')}]`;

    await db
      .insert(llmAnalysis)
      .values({
        meetingId: job.meetingId,
        promptVersion: 'v1',
        model: MODELS.LLM,
        analysisJson: analysis,
        embedding: embeddingVector,
      })
      .onConflictDoUpdate({
        target: [llmAnalysis.meetingId, llmAnalysis.promptVersion],
        set: {
          model: MODELS.LLM,
          analysisJson: analysis,
          embedding: embeddingVector,
          createdAt: new Date(),
        },
      });

    console.log(`Analysis stored for meeting ${meeting.id}`);

    // 7. Mark job as completed
    await db
      .update(processingJobs)
      .set({
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, job.id));

    return { success: true, jobId: job.id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`Job ${job.id} failed:`, errorMessage);

    // 8. Handle failure
    const newAttempts = job.attempts + 1;
    const newStatus = newAttempts >= MAX_ATTEMPTS ? 'failed' : 'pending';

    await db
      .update(processingJobs)
      .set({
        status: newStatus,
        attempts: newAttempts,
        errorMessage,
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, job.id));

    return {
      success: false,
      jobId: job.id,
      error: errorMessage,
    };
  }
}

/**
 * Process the next pending job
 */
export async function processNextJob(): Promise<{
  success: boolean;
  jobId?: string;
  error?: string;
} | null> {
  // 1. Get a pending job
  const [job] = await db
    .select()
    .from(processingJobs)
    .where(eq(processingJobs.status, 'pending'))
    .limit(1);

  if (!job) {
    return null; // No jobs to process
  }

  // 2. Mark as processing
  await db
    .update(processingJobs)
    .set({
      status: 'processing',
      updatedAt: new Date(),
    })
    .where(eq(processingJobs.id, job.id));

  // Delegate to internal processor
  return processJobInternal(job);
}

/**
 * Process multiple jobs in parallel
 */
export async function processBatchJobs(batchSize: number = 20): Promise<{
  processed: number;
  successful: number;
  failed: number;
  results: Array<{ success: boolean; jobId?: string; error?: string }>;
}> {
  // 1. Fetch batch of pending jobs
  const jobs = await db
    .select()
    .from(processingJobs)
    .where(eq(processingJobs.status, 'pending'))
    .limit(batchSize);

  if (jobs.length === 0) {
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      results: [],
    };
  }

  // 2. Mark all as processing immediately to prevent other workers from picking them up
  // We do this in a loop or a single query. Single query is better but Drizzle syntax for "where id in array" needed.
  // For simplicity and safety, let's update them one by one or use Promise.all for updates first.
  // Actually, to be safe against race conditions, we should have locked them in the select, but for now:

  const jobIds = jobs.map(j => j.id);

  // Update status to 'processing'
  // Note: In a real high-concurrency env, we'd use SELECT FOR UPDATE or a single UPDATE ... RETURNING
  // But here, let's just update them.
  for (const job of jobs) {
    await db
      .update(processingJobs)
      .set({
        status: 'processing',
        updatedAt: new Date(),
      })
      .where(eq(processingJobs.id, job.id));
  }

  // 3. Process in parallel
  console.log(`Starting parallel processing of ${jobs.length} jobs...`);

  const promises = jobs.map(job => processJobInternal(job));
  const results = await Promise.all(promises);

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  return {
    processed: results.length,
    successful,
    failed,
    results,
  };
}

/**
 * Get job statistics
 */
export async function getJobStats() {
  const [stats] = await db
    .select({
      pending: sql<number>`COUNT(*) FILTER (WHERE ${processingJobs.status} = 'pending')`,
      processing: sql<number>`COUNT(*) FILTER (WHERE ${processingJobs.status} = 'processing')`,
      completed: sql<number>`COUNT(*) FILTER (WHERE ${processingJobs.status} = 'completed')`,
      failed: sql<number>`COUNT(*) FILTER (WHERE ${processingJobs.status} = 'failed')`,
    })
    .from(processingJobs);

  return {
    pending: Number(stats.pending),
    processing: Number(stats.processing),
    completed: Number(stats.completed),
    failed: Number(stats.failed),
  };
}
