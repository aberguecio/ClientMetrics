import { NextResponse } from 'next/server';
import { getMeetingsWithFilters, getAllMeetingsWithAnalysis, calculateAnalytics } from '@/lib/db/queries';
import type { MergedFilter } from '@/types/charts';

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

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('Error calculating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to calculate analytics' },
      { status: 500 }
    );
  }
}
