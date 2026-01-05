import { getMeetingsWithFilters, getAllMeetingsWithAnalysis, calculateAnalytics } from '@/lib/db/queries';
import type { MergedFilter } from '@/types/charts';
import { successResponse, errorResponse } from '@/lib/api';

/**
 * POST /api/analytics
 * Calculate analytics for meetings with optional filters
 *
 * NOTE: This should ideally be a GET request since it's a read operation,
 * but uses POST to accept filter object in body
 *
 * @param request.body.filter - Optional filter object to apply to meetings
 * @returns Analytics object with calculated metrics
 * @throws {500} On database or calculation error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const filter: MergedFilter = body.filter || {};

    // Fetch meetings - either all or filtered
    const meetings = Object.keys(filter).length > 0
      ? await getMeetingsWithFilters(filter)
      : await getAllMeetingsWithAnalysis();

    // Calculate analytics from meetings
    const analytics = calculateAnalytics(meetings);

    return successResponse(analytics);
  } catch (error) {
    console.error('[API /analytics POST] Error:', error);
    return errorResponse('Failed to calculate analytics', error instanceof Error ? error.message : undefined);
  }
}
