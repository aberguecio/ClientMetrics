import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { isNotNull, sql } from 'drizzle-orm';
import { successResponse, errorResponse } from '@/lib/api';

/**
 * GET /api/meetings/filter-options
 * Get distinct values for filter dropdowns from meetings and analysis data
 *
 * @returns Object with arrays of unique values for: salesReps, sectors, companySizes, discoveryChannels
 * @throws {500} On database error
 */
export async function GET() {
  try {
    // Get unique sales reps
    const salesReps = await db
      .selectDistinct({ value: salesMeetings.salesRep })
      .from(salesMeetings)
      .where(isNotNull(salesMeetings.salesRep))
      .orderBy(salesMeetings.salesRep);

    // Get unique sectors from LLM analysis JSON
    const sectorsRaw = await db.select({
      value: sql<string>`DISTINCT ${llmAnalysis.analysisJson}->>'sector'`,
    }).from(llmAnalysis).where(isNotNull(llmAnalysis.analysisJson));

    // Get unique company sizes from LLM analysis JSON
    const companySizesRaw = await db.select({
      value: sql<string>`DISTINCT ${llmAnalysis.analysisJson}->>'company_size'`,
    }).from(llmAnalysis).where(isNotNull(llmAnalysis.analysisJson));

    // Get unique discovery channels from LLM analysis JSON
    const discoveryChannelsRaw = await db.select({
      value: sql<string>`DISTINCT ${llmAnalysis.analysisJson}->>'discovery_channel'`,
    }).from(llmAnalysis).where(isNotNull(llmAnalysis.analysisJson));

    // Filter out nulls and empty strings, then sort
    const sectors = sectorsRaw
      .map((r: { value: string }) => r.value)
      .filter((v: string) => v && v.trim())
      .sort();

    const companySizes = companySizesRaw
      .map((r: { value: string }) => r.value)
      .filter((v: string) => v && v.trim())
      .sort();

    const discoveryChannels = discoveryChannelsRaw
      .map((r: { value: string }) => r.value)
      .filter((v: string) => v && v.trim())
      .sort();

    return successResponse({
      salesReps: salesReps.map((r: { value: string | null }) => r.value).filter((v: string | null) => v),
      sectors,
      companySizes,
      discoveryChannels,
    });
  } catch (error) {
    console.error('[API /meetings/filter-options GET] Error:', error);
    return errorResponse('Failed to fetch filter options', error instanceof Error ? error.message : undefined);
  }
}
