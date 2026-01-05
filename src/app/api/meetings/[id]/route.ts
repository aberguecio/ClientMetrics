import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/api';

/**
 * GET /api/meetings/[id]
 * Get details of a specific meeting
 *
 * @param params.id - Meeting ID
 * @returns Meeting with LLM analysis details
 * @throws {404} If meeting not found
 * @throws {500} On database error
 */
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
      return notFoundResponse('Meeting');
    }

    return successResponse(result[0]);
  } catch (error) {
    console.error('[API /meetings/[id] GET] Error:', error);
    return errorResponse('Failed to fetch meeting', error instanceof Error ? error.message : undefined);
  }
}
