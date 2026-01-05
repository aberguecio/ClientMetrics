import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { llmAnalysis } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { createJobs } from '@/lib/jobs/processor';
import { successResponse, errorResponse, validationErrorResponse, validateIdArray } from '@/lib/api';

/**
 * POST /api/meetings/requeue
 * Requeue meetings for reprocessing by deleting existing analysis and creating new jobs
 *
 * @param request.body.ids - Array of meeting IDs to requeue (max 100)
 * @returns Success status with count of jobs created
 * @throws {400} If ids invalid or exceeds limit
 * @throws {500} On database error
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validate IDs array
    const validation = validateIdArray(ids, { min: 1, max: 100 });
    if (!validation.valid) {
      return validationErrorResponse(validation.error!);
    }

    // Delete existing analysis to trigger reprocessing
    await db.delete(llmAnalysis).where(inArray(llmAnalysis.meetingId, ids));

    // Create new jobs for AI processing
    await createJobs(ids);

    return successResponse({
      success: true,
      jobsCreated: ids.length,
    });
  } catch (error) {
    console.error('[API /meetings/requeue POST] Error:', error);
    return errorResponse('Failed to requeue meetings', error instanceof Error ? error.message : undefined);
  }
}
