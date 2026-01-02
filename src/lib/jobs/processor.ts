import { db } from '@/lib/db';
import { processingJobs, salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { categorizeMeetingWithRetry } from '@/lib/llm/categorize';
import { generateEmbeddingWithRetry, buildEmbeddingText } from '@/lib/llm/embeddings';
import { MODELS } from '@/lib/llm/openai';
import { triggerJobProcessing } from './auto-processor';

const MAX_ATTEMPTS = 3;

/**
 * Reset any jobs that were stuck in 'processing' state back to 'pending'
 * This should be called on application startup
 */
export async function resetStuckJobs() {
  const result = await db
    .update(processingJobs)
    .set({
      status: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(processingJobs.status, 'processing'))
    .returning();

  if (result.length > 0) {
    console.log(`Reset ${result.length} stuck jobs from 'processing' to 'pending'`);
  }
  triggerJobProcessing();

  return result.length;
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
 * Fetch and claim the next pending job atomically
 * Uses SKIP LOCKED to prevent race conditions between concurrent workers
 */
async function fetchNextJob() {
  // Use raw SQL for atomic fetch-and-update with SKIP LOCKED
  // This ensures multiple workers don't pick the same job
  const result = await db.execute(sql`
    UPDATE ${processingJobs}
    SET status = 'processing', updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM ${processingJobs}
      WHERE status = 'pending'
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `);

  // For node-postgres, result is a QueryResult object with a rows property
  const rows = (result as any).rows;

  if (!rows || rows.length === 0) {
    return undefined;
  }

  const rawJob = rows[0];

  // Map raw snake_case to camelCase matches Drizzle schema
  return {
    id: rawJob.id,
    meetingId: rawJob.meeting_id,
    status: rawJob.status,
    attempts: rawJob.attempts,
    errorMessage: rawJob.error_message,
    createdAt: rawJob.created_at,
    updatedAt: rawJob.updated_at,
  };
}

/**
 * Process jobs concurrently using a worker pool
 * Each worker continuously fetches and processes jobs until the queue is empty
 */
export async function processJobsConcurrently(concurrency: number = 20): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  let processed = 0;
  let successful = 0;
  let failed = 0;

  // Worker function: keeps taking jobs until none are left
  const worker = async (workerId: number) => {
    console.log(`Worker ${workerId} started`);

    while (true) {
      try {
        const job = await fetchNextJob();

        if (!job) {
          // No more jobs available
          break;
        }

        // Process the job
        const result = await processJobInternal(job);

        processed++;
        if (result.success) {
          successful++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`Worker ${workerId} error:`, error);
        // Don't crash the worker, just try next job
      }
    }

    console.log(`Worker ${workerId} finished`);
  };

  // Start N workers
  console.log(`Starting ${concurrency} concurrent workers...`);
  const workers = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(worker(i + 1));
  }

  // Wait for all workers to finish
  await Promise.all(workers);

  return {
    processed,
    successful,
    failed,
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
