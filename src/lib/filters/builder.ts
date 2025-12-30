import { eq, and, gte, lte, type SQL } from 'drizzle-orm';
import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import type { MergedFilter } from '@/types/charts';
import type { SalesMeeting } from '@/lib/db/schema';

/**
 * Builds a Drizzle query with dynamic WHERE conditions based on the provided filter
 *
 * @param filter - Merged filter object containing all filter criteria
 * @returns Array of meetings matching the filter criteria
 */
export async function getMeetingsWithFilters(filter: MergedFilter): Promise<(SalesMeeting & { analysis?: any })[]> {
  console.log('🔍 [BUILDER] Building query with filter:', JSON.stringify(filter, null, 2));

  const conditions: SQL[] = [];

  // Base fields from sales_meetings table
  if (filter.sales_rep) {
    console.log('  ✓ Adding SQL condition: sales_rep =', filter.sales_rep);
    conditions.push(eq(salesMeetings.salesRep, filter.sales_rep));
  }
  if (filter.closed !== undefined && filter.closed !== null) {
    console.log('  ✓ Adding SQL condition: closed =', filter.closed);
    conditions.push(eq(salesMeetings.closed, filter.closed));
  }
  if (filter.date_from) {
    console.log('  ✓ Adding SQL condition: meetingDate >=', filter.date_from);
    conditions.push(gte(salesMeetings.meetingDate, filter.date_from));
  }
  if (filter.date_to) {
    console.log('  ✓ Adding SQL condition: meetingDate <=', filter.date_to);
    conditions.push(lte(salesMeetings.meetingDate, filter.date_to));
  }

  // Build the base query
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  console.log('📊 [BUILDER] SQL WHERE conditions count:', conditions.length);

  // Fetch meetings with LLM analysis
  const meetingsWithAnalysis = await db
    .select({
      meeting: salesMeetings,
      analysis: llmAnalysis.analysisJson,
    })
    .from(salesMeetings)
    .leftJoin(llmAnalysis, eq(salesMeetings.id, llmAnalysis.meetingId))
    .where(whereClause);

  console.log('📊 [BUILDER] SQL query returned:', meetingsWithAnalysis.length, 'meetings');

  // Filter by LLM analysis fields (these are in JSONB, so we filter in-memory)
  let filteredMeetings = meetingsWithAnalysis.map((row) => ({
    ...row.meeting,
    analysis: row.analysis,
  }));

  const initialCount = filteredMeetings.length;

  // Apply LLM-based filters
  if (filter.sector) {
    console.log('  🔍 Filtering by sector:', filter.sector);
    filteredMeetings = filteredMeetings.filter(
      (m) => m.analysis && (m.analysis as any).sector === filter.sector
    );
    console.log('    Result:', filteredMeetings.length, 'meetings (filtered out', initialCount - filteredMeetings.length, ')');
  }

  if (filter.company_size) {
    const beforeFilter = filteredMeetings.length;
    console.log('  🔍 Filtering by company_size:', filter.company_size);
    filteredMeetings = filteredMeetings.filter(
      (m) => m.analysis && (m.analysis as any).company_size === filter.company_size
    );
    console.log('    Result:', filteredMeetings.length, 'meetings (filtered out', beforeFilter - filteredMeetings.length, ')');
  }

  if (filter.discovery_channel) {
    const beforeFilter = filteredMeetings.length;
    console.log('  🔍 Filtering by discovery_channel:', filter.discovery_channel);
    filteredMeetings = filteredMeetings.filter(
      (m) => m.analysis && (m.analysis as any).discovery_channel === filter.discovery_channel
    );
    console.log('    Result:', filteredMeetings.length, 'meetings (filtered out', beforeFilter - filteredMeetings.length, ')');
  }

  if (filter.pain_points) {
    const beforeFilter = filteredMeetings.length;
    console.log('  🔍 Filtering by pain_points:', filter.pain_points);
    filteredMeetings = filteredMeetings.filter(
      (m) => m.analysis && (m.analysis as any).pain_points?.includes(filter.pain_points)
    );
    console.log('    Result:', filteredMeetings.length, 'meetings (filtered out', beforeFilter - filteredMeetings.length, ')');
  }

  if (filter.budget_range) {
    const beforeFilter = filteredMeetings.length;
    console.log('  🔍 Filtering by budget_range:', filter.budget_range);
    filteredMeetings = filteredMeetings.filter(
      (m) => m.analysis && (m.analysis as any).budget_range === filter.budget_range
    );
    console.log('    Result:', filteredMeetings.length, 'meetings (filtered out', beforeFilter - filteredMeetings.length, ')');
  }

  if (filter.decision_maker !== undefined && filter.decision_maker !== null) {
    const beforeFilter = filteredMeetings.length;
    console.log('  🔍 Filtering by decision_maker:', filter.decision_maker);
    filteredMeetings = filteredMeetings.filter(
      (m) => m.analysis && (m.analysis as any).decision_maker === filter.decision_maker
    );
    console.log('    Result:', filteredMeetings.length, 'meetings (filtered out', beforeFilter - filteredMeetings.length, ')');
  }

  console.log('✅ [BUILDER] Final result:', filteredMeetings.length, 'meetings');
  return filteredMeetings;
}
