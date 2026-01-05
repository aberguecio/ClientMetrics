import { getJobStats } from '@/lib/jobs/processor';
import { successResponse, errorResponse } from '@/lib/api';

/**
 * GET /api/process-jobs
 * Retrieve job processing statistics
 *
 * NOTE: This endpoint only returns stats - actual job processing is handled
 * by the auto-processor running in the background
 *
 * @returns Job statistics (pending, processing, completed, failed counts)
 * @throws {500} On database error
 */
export async function GET() {
  try {
    const stats = await getJobStats();

    return successResponse({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('[API /process-jobs GET] Error:', error);
    return errorResponse('Failed to get job stats', error instanceof Error ? error.message : undefined);
  }
}
