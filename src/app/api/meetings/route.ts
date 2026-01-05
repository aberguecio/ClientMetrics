import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';
import { successResponse, errorResponse, validationErrorResponse, validateIdArray } from '@/lib/api';

/**
 * GET /api/meetings
 * List all sales meetings with pagination
 *
 * @param request.query.page - Page number (default: 1)
 * @returns Paginated list of meetings with analysis
 * @throws {500} On database error
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;

    // Query all meetings with their LLM analysis
    const meetings = await db
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
        analysis: llmAnalysis.analysisJson,
      })
      .from(salesMeetings)
      .leftJoin(llmAnalysis, eq(salesMeetings.id, llmAnalysis.meetingId))
      .orderBy(desc(salesMeetings.meetingDate))
      .limit(limit)
      .offset((page - 1) * limit);

    // Count total
    const [{ count: total }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(salesMeetings);

    return successResponse({
      meetings,
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    console.error('[API /meetings GET] Error:', error);
    return errorResponse('Failed to fetch meetings', error instanceof Error ? error.message : undefined);
  }
}

/**
 * DELETE /api/meetings
 * Delete multiple meetings by IDs
 *
 * @param request.body.ids - Array of meeting IDs to delete (max 100)
 * @returns Success status with count of deleted meetings
 * @throws {400} If ids invalid or exceeds limit
 * @throws {500} On database error
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    // Validate IDs array
    const validation = validateIdArray(ids, { min: 1, max: 100 });
    if (!validation.valid) {
      return validationErrorResponse(validation.error!);
    }

    // Delete llm_analysis first (foreign key constraint)
    await db.delete(llmAnalysis).where(inArray(llmAnalysis.meetingId, ids));

    // Delete meetings
    await db.delete(salesMeetings).where(inArray(salesMeetings.id, ids));

    return successResponse({
      success: true,
      deleted: ids.length,
    });
  } catch (error) {
    console.error('[API /meetings DELETE] Error:', error);
    return errorResponse('Failed to delete meetings', error instanceof Error ? error.message : undefined);
  }
}
