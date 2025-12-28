import type { SalesMeeting, LlmAnalysis, Upload, ProcessingJob } from '@/lib/db/schema';

// Extended types with joins
export type MeetingWithAnalysis = SalesMeeting & {
  llm_analysis?: LlmAnalysis | null;
};

export type MeetingWithUpload = SalesMeeting & {
  upload?: Upload | null;
};

export type MeetingFull = SalesMeeting & {
  llm_analysis?: LlmAnalysis | null;
  upload?: Upload | null;
};

// Job status type
export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';
