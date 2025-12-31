import { z } from 'zod';
import {
  SECTOR_VALUES,
  DISCOVERY_CHANNEL_VALUES,
  COMPANY_SIZE_VALUES,
  PERSONALIZATION_VALUES,
  INTEGRATION_VALUES,
  DEMAND_PEAK_VALUES,
  QUERY_TYPE_VALUES,
  TOOL_VALUES,
} from '@/lib/constants/llm-enums';

// Validation schema for LLM analysis
export const AnalysisSchema = z.object({
  // Business context
  sector: z.enum(SECTOR_VALUES),
  company_size: z.enum(COMPANY_SIZE_VALUES),

  // Operational metrics
  interaction_volume_daily: z.number().int().min(0),

  // Discovery
  discovery_channel: z.enum(DISCOVERY_CHANNEL_VALUES),

  // Detailed insights
  pain_points: z.array(z.string()),
  use_cases: z.array(z.string()),
  objections: z.array(z.string()),

  // Additional unstructured insights
  others: z.string(), // Free-form field for important insights not captured elsewhere

  // Technical requirements
  requirements: z.object({
    personalization: z.array(z.enum(PERSONALIZATION_VALUES)),
    integrations: z.array(z.enum(INTEGRATION_VALUES)),
    confidentiality: z.boolean(),
    multilingual: z.boolean(),
    real_time: z.boolean(),
  }),

  // Business patterns
  demand_peaks: z.array(z.enum(DEMAND_PEAK_VALUES)),
  query_types: z.array(z.enum(QUERY_TYPE_VALUES)),
  tools_mentioned: z.array(z.enum(TOOL_VALUES)),

  // Confidence scores
  confidence: z.object({
    sector: z.number().min(0).max(1),
  }),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

// Parameters for categorization
export interface CategorizationParams {
  transcript: string;
  clientName: string;
  salesRep: string;
  meetingDate: string;
  closed: boolean;
}