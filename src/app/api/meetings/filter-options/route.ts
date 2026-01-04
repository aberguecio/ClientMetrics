import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { isNotNull, sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Sales reps únicos
    const salesReps = await db
      .selectDistinct({ value: salesMeetings.salesRep })
      .from(salesMeetings)
      .where(isNotNull(salesMeetings.salesRep))
      .orderBy(salesMeetings.salesRep);

    // Sectores únicos del análisis JSON
    const sectorsRaw = await db.select({
      value: sql<string>`DISTINCT ${llmAnalysis.analysisJson}->>'sector'`,
    }).from(llmAnalysis).where(isNotNull(llmAnalysis.analysisJson));

    // Company sizes únicos
    const companySizesRaw = await db.select({
      value: sql<string>`DISTINCT ${llmAnalysis.analysisJson}->>'company_size'`,
    }).from(llmAnalysis).where(isNotNull(llmAnalysis.analysisJson));

    // Discovery channels únicos
    const discoveryChannelsRaw = await db.select({
      value: sql<string>`DISTINCT ${llmAnalysis.analysisJson}->>'discovery_channel'`,
    }).from(llmAnalysis).where(isNotNull(llmAnalysis.analysisJson));

    // Filtrar nulls y vacíos
    const sectors = sectorsRaw
      .map(r => r.value)
      .filter(v => v && v.trim())
      .sort();

    const companySizes = companySizesRaw
      .map(r => r.value)
      .filter(v => v && v.trim())
      .sort();

    const discoveryChannels = discoveryChannelsRaw
      .map(r => r.value)
      .filter(v => v && v.trim())
      .sort();

    return NextResponse.json({
      salesReps: salesReps.map(r => r.value).filter(v => v),
      sectors,
      companySizes,
      discoveryChannels,
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    );
  }
}
