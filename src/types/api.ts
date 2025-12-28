import type { SalesMeeting, LlmAnalysis } from '@/lib/db/schema';
import type { Analysis } from './llm';

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Upload API
export interface UploadResponse {
  success: boolean;
  uploadId: string;
  rowCount: number;
  message?: string;
}

// Meetings API
export interface MeetingsListResponse {
  meetings: Array<SalesMeeting & { llm_analysis?: LlmAnalysis }>;
  page: number;
  limit: number;
  total?: number;
}

export interface MeetingDetailResponse {
  meeting: SalesMeeting;
  analysis?: Analysis | null;
}

export interface SimilarMeetingsResponse {
  similar: Array<SalesMeeting & { distance: number; analysis?: Analysis }>;
}

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
