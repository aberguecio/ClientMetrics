import { NextResponse } from 'next/server';
import { getJobStats } from '@/lib/jobs/processor';

/**
 * GET endpoint to retrieve job processing statistics
 * This endpoint only returns stats - actual job processing is handled
 * by the auto-processor running in the background
 */
export async function GET() {
  try {
    const stats = await getJobStats();

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error('Error getting job stats:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener estadísticas',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
