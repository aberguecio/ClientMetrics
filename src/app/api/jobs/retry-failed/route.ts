import { db } from '@/lib/db';
import { processingJobs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/api';

/**
 * POST /api/jobs/retry-failed
 * Reset all failed jobs to pending status and trigger processing
 *
 * @returns Success status with count of jobs requeued
 * @throws {500} On database error
 */
export async function POST() {
    try {
        // Find all failed jobs
        const failedJobs = await db
            .select()
            .from(processingJobs)
            .where(eq(processingJobs.status, 'failed'));

        if (failedJobs.length === 0) {
            return successResponse({
                success: true,
                message: 'No failed jobs to retry',
                count: 0,
            });
        }

        // Reset status to pending and attempts to 0
        await db
            .update(processingJobs)
            .set({
                status: 'pending',
                attempts: 0,
                errorMessage: null,
                updatedAt: new Date(),
            })
            .where(eq(processingJobs.status, 'failed'));

        // Trigger processing immediately
        const { triggerJobProcessing } = await import('@/lib/jobs/auto-processor');
        triggerJobProcessing();

        return successResponse({
            success: true,
            message: `${failedJobs.length} failed jobs requeued`,
            count: failedJobs.length,
        });
    } catch (error) {
        console.error('[API /jobs/retry-failed POST] Error:', error);
        return errorResponse('Failed to retry failed jobs', error instanceof Error ? error.message : undefined);
    }
}
