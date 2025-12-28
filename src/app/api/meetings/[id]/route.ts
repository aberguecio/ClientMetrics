import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const result = await db
      .select({
        id: salesMeetings.id,
        clientName: salesMeetings.clientName,
        email: salesMeetings.email,
        phone: salesMeetings.phone,
        meetingDate: salesMeetings.meetingDate,
        salesRep: salesMeetings.salesRep,
        closed: salesMeetings.closed,
        transcript: salesMeetings.transcript,
        createdAt: salesMeetings.createdAt,
        updatedAt: salesMeetings.updatedAt,
        llm_analysis: {
          id: llmAnalysis.id,
          analysisJson: llmAnalysis.analysisJson,
          createdAt: llmAnalysis.createdAt,
        },
      })
      .from(salesMeetings)
      .leftJoin(llmAnalysis, eq(salesMeetings.id, llmAnalysis.meetingId))
      .where(eq(salesMeetings.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reunión no encontrada',
        },
        { status: 404 }
      );
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener la reunión',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
