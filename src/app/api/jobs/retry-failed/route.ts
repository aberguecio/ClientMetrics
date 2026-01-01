import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { processingJobs } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function POST() {
    try {
        // Find all failed jobs
        const failedJobs = await db
            .select()
            .from(processingJobs)
            .where(eq(processingJobs.status, 'failed'));

        if (failedJobs.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay trabajos fallidos para reintentar',
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

        return NextResponse.json({
            success: true,
            message: `Se han reencolado ${failedJobs.length} trabajos fallidos`,
            count: failedJobs.length,
        });
    } catch (error) {
        console.error('Error retrying failed jobs:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Error al reintentar trabajos fallidos',
            },
            { status: 500 }
        );
    }
}
