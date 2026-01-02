import type { SalesMeeting, LlmAnalysis } from '@/lib/db/schema';
import type { Analysis } from './llm';



// Metrics API
export interface MetricsOverview {
  totalMeetings: number;
  winRate: number;
  avgConfidence: number;
  topSalesRep: string;
}

export interface RepPerformance {
  salesRep: string;
  totalMeetings: number;
  closed: number;
  winRate: number;
}

export interface CategoryDistribution {
  category: string;
  value: string;
  count: number;
  percentage: number;
}

export interface TrendData {
  date: string;
  totalMeetings: number;
  closed: number;
  winRate: number;
}

// Analytics response for dashboard
export interface AnalyticsData {
  total: number;
  winRate: number;
  avgConfidence: number;
  bySector: Array<{ sector: string; count: number }>;
}

// Meeting detail response
export interface MeetingDetail {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  meetingDate: string;
  salesRep: string;
  closed: boolean;
  transcript: string;
  llm_analysis?: {
    id: string | null;
    analysisJson: Analysis | null;
    createdAt: string | null;
  };
}
