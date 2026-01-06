import { db } from './index';
import { salesMeetings, llmAnalysis, processingJobs, uploads } from './schema';
import { eq, desc, and, sql, count, isNull, inArray, gte, lte } from 'drizzle-orm';
import type { MetricsOverview, RepPerformance, CategoryDistribution, TrendData, AnalyticsData } from '@/types/api';
import type { SavedFilter, MergedFilter } from '@/types/charts';
import { calculatePercentage } from '../utils';


/**
 * Get all meetings with analysis
 */
export async function getAllMeetingsWithAnalysis() {
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
      analysisJson: llmAnalysis.analysisJson,
    })
    .from(salesMeetings)
    .leftJoin(llmAnalysis, eq(salesMeetings.id, llmAnalysis.meetingId))
    .orderBy(desc(salesMeetings.meetingDate));

  return meetings;
}

/**
 * Get meetings filtered by filter criteria (accepts either SavedFilter or MergedFilter)
 */
export async function getMeetingsWithFilters(filter: SavedFilter | MergedFilter) {
  // Accept either a SavedFilter (DB) or MergedFilter (plain object). Normalize to MergedFilter for checks
  const filterData: MergedFilter = (filter as SavedFilter).filter_data ? (filter as SavedFilter).filter_data : (filter as MergedFilter);
  const conditions: any[] = [];

  // Base fields filters
  if (filterData.sales_rep) {
    conditions.push(eq(salesMeetings.salesRep, filterData.sales_rep));
  }
  if (filterData.closed !== undefined && filterData.closed !== null) {
    conditions.push(eq(salesMeetings.closed, filterData.closed));
  }

  // Date range filters
  if (filterData.date_from) {
    conditions.push(gte(salesMeetings.meetingDate, filterData.date_from));
  }
  if (filterData.date_to) {
    conditions.push(lte(salesMeetings.meetingDate, filterData.date_to));
  }

  // LLM analysis JSONB filters
  if (filterData.sector) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'sector' = ${filterData.sector}`);
  }
  if (filterData.company_size) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'company_size' = ${filterData.company_size}`);
  }
  if (filterData.discovery_channel) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'discovery_channel' = ${filterData.discovery_channel}`);
  }
  if (filterData.budget_range) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'budget_range' = ${filterData.budget_range}`);
  }
  if (filterData.decision_maker !== undefined && filterData.decision_maker !== null) {
    conditions.push(sql`CAST(${llmAnalysis.analysisJson}->>'decision_maker' AS BOOLEAN) = ${filterData.decision_maker}`);
  }
  if (filterData.pain_points) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'pain_points' ILIKE ${'%' + filterData.pain_points + '%'}`);
  }

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
      analysisJson: llmAnalysis.analysisJson,
    })
    .from(salesMeetings)
    .leftJoin(llmAnalysis, eq(salesMeetings.id, llmAnalysis.meetingId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(salesMeetings.meetingDate));

  return meetings;
}

/**
 * Calculate analytics from meetings data
 */
export function calculateAnalytics(meetings: any[]): AnalyticsData {
  const total = meetings.length;
  const closedCount = meetings.filter(m => m.closed).length;
  const winRate = calculatePercentage(closedCount, total);

  // Calculate average confidence from analysis
  const meetingsWithAnalysis = meetings.filter(m => m.analysisJson?.confidence);
  const avgConfidence = meetingsWithAnalysis.length > 0
    ? meetingsWithAnalysis.reduce((sum, m) => sum + (m.analysisJson.confidence || 0), 0) / meetingsWithAnalysis.length
    : 0;

  // Group by sector
  const sectorMap: Record<string, number> = {};
  meetings.forEach(m => {
    const sector = m.analysisJson?.sector || 'Sin analizar';
    sectorMap[sector] = (sectorMap[sector] || 0) + 1;
  });

  const bySector = Object.entries(sectorMap).map(([sector, count]) => ({
    sector,
    count,
  }));

  return {
    total,
    winRate,
    avgConfidence,
    bySector,
  };
}
