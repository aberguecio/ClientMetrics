import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { llmAnalysis } from '@/lib/db/schema';
import { inArray } from 'drizzle-orm';
import { createJobs } from '@/lib/jobs/processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere un array de IDs',
        },
        { status: 400 }
      );
    }

    // Validate max 100 IDs
    if (ids.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Máximo 100 reuniones por operación',
        },
        { status: 400 }
      );
    }

    // Delete existing analysis
    await db.delete(llmAnalysis).where(inArray(llmAnalysis.meetingId, ids));

    // Create new jobs for AI processing
    await createJobs(ids);

    return NextResponse.json({
      success: true,
      jobsCreated: ids.length,
    });
  } catch (error) {
    console.error('Error requeuing meetings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al reencolar las reuniones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
