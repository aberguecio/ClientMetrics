import { z } from 'zod';

// Validation schema for LLM analysis
export const AnalysisSchema = z.object({
  // Core metrics
  interest_level: z.enum(['low', 'medium', 'high']),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  urgency: z.enum(['low', 'medium', 'high']),
  icp_fit: z.enum(['low', 'medium', 'high']),

  // Business context
  sector: z.enum([
    'financiero', 'ecommerce', 'salud', 'educacion', 'logistica',
    'viajes', 'moda', 'consultoria', 'restaurante', 'software',
    'catering', 'bienes_raices', 'ong', 'seguridad', 'turismo',
    'legal', 'eventos', 'tecnologia', 'ambiental', 'transporte',
    'traduccion', 'diseño', 'produccion_audiovisual', 'contabilidad',
    'belleza', 'energia_renovable', 'yoga', 'construccion', 'pasteleria',
    'cosmeticos', 'arquitectura', 'alimentos', 'marketing', 'libreria',
    'fotografia', 'agricultura', 'otro'
  ]),
  company_size: z.enum(['startup', 'pequeña', 'mediana', 'grande', 'enterprise']),

  // Operational metrics
  interaction_volume_daily: z.number().int().min(0),
  specific_pain: z.string(), // Main pain point described in detail

  // Discovery & interest
  discovery_channel: z.enum([
    'colega', 'google', 'conferencia', 'feria', 'webinar',
    'podcast', 'articulo', 'linkedin', 'recomendacion_amigo',
    'foro', 'grupo_emprendedores', 'seminario', 'evento_networking',
    'charla', 'otro'
  ]),
  clear_vambe_interest: z.boolean(),

  // Detailed insights
  pain_points: z.array(z.string()),
  use_cases: z.array(z.string()),
  objections: z.array(z.string()),

  // Additional unstructured insights
  others: z.string(), // Free-form field for important insights not captured elsewhere

  // Confidence scores
  confidence: z.object({
    interest_level: z.number().min(0).max(1),
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