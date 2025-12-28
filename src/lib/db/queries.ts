import { db } from './index';
import { salesMeetings, llmAnalysis, processingJobs, uploads } from './schema';
import { eq, desc, and, sql, count, isNull } from 'drizzle-orm';
import type { MetricsOverview, RepPerformance, CategoryDistribution, TrendData } from '@/types/api';

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
