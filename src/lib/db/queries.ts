import { db } from './index';
import { salesMeetings, llmAnalysis, processingJobs, uploads } from './schema';
import { eq, desc, and, sql, count, isNull, inArray, gte, lte } from 'drizzle-orm';
import type { MetricsOverview, RepPerformance, CategoryDistribution, TrendData, AnalyticsData } from '@/types/api';
import type { SavedFilter } from '@/types/charts';
import { calculatePercentage } from '../utils';

/**
 * Get overall metrics overview
 */
export async function getMetricsOverview(): Promise<MetricsOverview> {
  const results = await db
    .select({
      totalMeetings: count(),
      closedMeetings: sql<number>`SUM(CASE WHEN ${salesMeetings.closed} = true THEN 1 ELSE 0 END)`,
    })
    .from(salesMeetings);

  const result = results[0];
  const totalMeetings = result?.totalMeetings || 0;
  const closedMeetings = Number(result?.closedMeetings) || 0;
  const winRate = totalMeetings > 0 ? Math.round((closedMeetings / totalMeetings) * 100) : 0;

  // Get average confidence from LLM analysis
  const confidenceResults = await db
    .select({
      avgConfidence: sql<number>`AVG(CAST(${llmAnalysis.analysisJson}->>'confidence' AS FLOAT))`,
    })
    .from(llmAnalysis);

  const avgConfidence = Number(confidenceResults[0]?.avgConfidence) || 0;

  // Get top sales rep by win rate
  const topRepResults = await db
    .select({
      salesRep: salesMeetings.salesRep,
      closed: sql<number>`SUM(CASE WHEN ${salesMeetings.closed} = true THEN 1 ELSE 0 END)`,
      total: count(),
    })
    .from(salesMeetings)
    .groupBy(salesMeetings.salesRep)
    .orderBy(desc(sql`SUM(CASE WHEN ${salesMeetings.closed} = true THEN 1 ELSE 0 END)`))
    .limit(1);

  const topSalesRep = topRepResults[0]?.salesRep || 'N/A';

  return {
    totalMeetings,
    winRate,
    avgConfidence: Math.round(avgConfidence * 100) / 100,
    topSalesRep,
  };
}

/**
 * Get performance metrics by sales rep
 */
export async function getMetricsByRep(): Promise<RepPerformance[]> {
  const results = await db
    .select({
      salesRep: salesMeetings.salesRep,
      totalMeetings: count(),
      closed: sql<number>`SUM(CASE WHEN ${salesMeetings.closed} = true THEN 1 ELSE 0 END)`,
    })
    .from(salesMeetings)
    .groupBy(salesMeetings.salesRep)
    .orderBy(desc(count()));

  return results.map(row => ({
    salesRep: row.salesRep,
    totalMeetings: row.totalMeetings,
    closed: Number(row.closed),
    winRate: row.totalMeetings > 0
      ? Math.round((Number(row.closed) / row.totalMeetings) * 100)
      : 0,
  }));
}

/**
 * Get distribution by LLM category
 */
export async function getMetricsByCategory(category: string = 'funnel_stage'): Promise<CategoryDistribution[]> {
  const results = await db
    .select({
      value: sql<string>`${llmAnalysis.analysisJson}->>'${sql.raw(category)}'`,
      count: count(),
    })
    .from(llmAnalysis)
    .groupBy(sql`${llmAnalysis.analysisJson}->>'${sql.raw(category)}'`)
    .orderBy(desc(count()));

  const total = results.reduce((sum, row) => sum + row.count, 0);

  return results.map(row => ({
    category,
    value: row.value || 'unknown',
    count: row.count,
    percentage: total > 0 ? Math.round((row.count / total) * 100) : 0,
  }));
}

/**
 * Get trends over time
 */
export async function getTrends(
  interval: 'day' | 'week' | 'month' = 'week',
  from?: string | null,
  to?: string | null
): Promise<TrendData[]> {
  const dateFormat = interval === 'day'
    ? 'YYYY-MM-DD'
    : interval === 'week'
    ? 'YYYY-IW'
    : 'YYYY-MM';

  const results = await db
    .select({
      date: sql<string>`TO_CHAR(${salesMeetings.meetingDate}, '${sql.raw(dateFormat)}')`,
      totalMeetings: count(),
      closed: sql<number>`SUM(CASE WHEN ${salesMeetings.closed} = true THEN 1 ELSE 0 END)`,
    })
    .from(salesMeetings)
    .groupBy(sql`TO_CHAR(${salesMeetings.meetingDate}, '${sql.raw(dateFormat)}')`)
    .orderBy(sql`TO_CHAR(${salesMeetings.meetingDate}, '${sql.raw(dateFormat)}')`);

  return results.map(row => ({
    date: row.date,
    totalMeetings: row.totalMeetings,
    closed: Number(row.closed),
    winRate: row.totalMeetings > 0
      ? Math.round((Number(row.closed) / row.totalMeetings) * 100)
      : 0,
  }));
}

/**
 * Get pending processing jobs count
 */
export async function getPendingJobsCount(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(processingJobs)
    .where(eq(processingJobs.status, 'pending'));

  return result[0]?.count || 0;
}

/**
 * Get failed processing jobs count
 */
export async function getFailedJobsCount(): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(processingJobs)
    .where(eq(processingJobs.status, 'failed'));

  return result[0]?.count || 0;
}

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
 * Get meetings by specific IDs
 */
export async function getMeetingsByIds(ids: string[]) {
  if (!ids || ids.length === 0) {
    return [];
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
    .where(inArray(salesMeetings.id, ids))
    .orderBy(desc(salesMeetings.meetingDate));

  return meetings;
}

/**
 * Get meetings filtered by SavedFilter criteria
 */
export async function getMeetingsWithFilters(filter: SavedFilter) {
  const conditions: any[] = [];

  // Base fields filters
  if (filter.sales_rep) {
    conditions.push(eq(salesMeetings.salesRep, filter.sales_rep));
  }
  if (filter.closed !== undefined && filter.closed !== null) {
    conditions.push(eq(salesMeetings.closed, filter.closed));
  }

  // Date range filters
  if (filter.date_from) {
    conditions.push(gte(salesMeetings.meetingDate, filter.date_from));
  }
  if (filter.date_to) {
    conditions.push(lte(salesMeetings.meetingDate, filter.date_to));
  }

  // LLM analysis JSONB filters
  if (filter.sector) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'sector' = ${filter.sector}`);
  }
  if (filter.company_size) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'company_size' = ${filter.company_size}`);
  }
  if (filter.discovery_channel) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'discovery_channel' = ${filter.discovery_channel}`);
  }
  if (filter.budget_range) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'budget_range' = ${filter.budget_range}`);
  }
  if (filter.decision_maker !== undefined && filter.decision_maker !== null) {
    conditions.push(sql`CAST(${llmAnalysis.analysisJson}->>'decision_maker' AS BOOLEAN) = ${filter.decision_maker}`);
  }
  if (filter.pain_points) {
    conditions.push(sql`${llmAnalysis.analysisJson}->>'pain_points' ILIKE ${'%' + filter.pain_points + '%'}`);
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
