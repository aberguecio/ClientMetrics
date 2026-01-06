/**
 * Field Metadata Registry
 *
 * Single source of truth for all field metadata in the chart system.
 * Defines field categories, paths, labels, and compatibility information.
 */

import {
  SECTOR_VALUES,
  SECTOR_LABELS,
  COMPANY_SIZE_VALUES,
  COMPANY_SIZE_LABELS,
  DISCOVERY_CHANNEL_VALUES,
  DISCOVERY_CHANNEL_LABELS,
  PERSONALIZATION_VALUES,
  PERSONALIZATION_LABELS,
  INTEGRATION_VALUES,
  INTEGRATION_LABELS,
  DEMAND_PEAK_VALUES,
  DEMAND_PEAK_LABELS,
  QUERY_TYPE_VALUES,
  QUERY_TYPE_LABELS,
  TOOL_VALUES,
  TOOL_LABELS,
} from '../constants/llm-enums';

/**
 * Field categories define the fundamental data type and usage pattern of a field
 */
export enum FieldCategory {
  CATEGORICAL = 'categorical',      // Discrete categories (sector, company_size, salesRep)
  BOOLEAN = 'boolean',              // True/false values (requirements.confidentiality)
  TEMPORAL = 'temporal',            // Date/time values (meetingDate)
  NUMERIC = 'numeric',              // Quantifiable numbers (interaction_volume_daily, count)
  CLOSED_ARRAY = 'closed_array',   // Arrays with predefined enum values (requirements.personalization)
  OPEN_ARRAY = 'open_array',       // Arrays with free-form text (pain_points, use_cases)
  FREE_TEXT = 'free_text',         // Open-ended text fields (others)
}

/**
 * Complete metadata for a field
 */
export interface FieldMetadata {
  key: string;                      // Unique identifier ('sector', 'requirements.integrations')
  label: string;                    // Human-readable label
  category: FieldCategory;          // Field category
  path: string[];                   // Path to access value (['requirements', 'integrations'])
  isNested: boolean;                // true if field is in LLM analysis JSON
  aggregable: boolean;              // true only for NUMERIC fields (can use sum/avg/min/max)
  temporal: boolean;                // true only for TEMPORAL fields (supports time grouping)
  enumValues?: readonly string[];   // For CATEGORICAL and CLOSED_ARRAY fields
  labelMap?: Record<string, string>; // Human-readable enum labels
}

/**
 * Complete field registry
 *
 * All fields available in the system are registered here with complete metadata.
 * This is the single source of truth for field information.
 */
const FIELD_REGISTRY: Record<string, FieldMetadata> = {
  // ===== BASE FIELDS (not from LLM analysis) =====

  salesRep: {
    key: 'salesRep',
    label: 'Representante de Ventas',
    category: FieldCategory.CATEGORICAL,
    path: ['salesRep'],
    isNested: false,
    aggregable: false,
    temporal: false,
  },

  closed: {
    key: 'closed',
    label: 'Estado (Cerrada/Abierta)',
    category: FieldCategory.BOOLEAN,
    path: ['closed'],
    isNested: false,
    aggregable: false,
    temporal: false,
  },

  meetingDate: {
    key: 'meetingDate',
    label: 'Fecha de Reunión',
    category: FieldCategory.TEMPORAL,
    path: ['meetingDate'],
    isNested: false,
    aggregable: false,
    temporal: true,
  },



  clientName: {
    key: 'clientName',
    label: 'Nombre del Cliente',
    category: FieldCategory.CATEGORICAL,
    path: ['clientName'],
    isNested: false,
    aggregable: false,
    temporal: false,
  },

  embedding: {
    key: 'embedding',
    label: 'Embedding (Vector)',
    category: FieldCategory.FREE_TEXT, // Stored as text, used for vector analysis
    path: ['embedding'],
    isNested: false,
    aggregable: false,
    temporal: false,
  },

  count: {
    key: 'count',
    label: 'Cantidad de Reuniones',
    category: FieldCategory.NUMERIC,
    path: ['count'],
    isNested: false,
    aggregable: true,
    temporal: false,
  },

  // ===== LLM CATEGORICAL FIELDS (enum-based) =====

  sector: {
    key: 'sector',
    label: 'Sector',
    category: FieldCategory.CATEGORICAL,
    path: ['sector'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: SECTOR_VALUES,
    labelMap: SECTOR_LABELS,
  },

  company_size: {
    key: 'company_size',
    label: 'Tamaño de Empresa',
    category: FieldCategory.CATEGORICAL,
    path: ['company_size'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: COMPANY_SIZE_VALUES,
    labelMap: COMPANY_SIZE_LABELS,
  },

  discovery_channel: {
    key: 'discovery_channel',
    label: 'Canal de Descubrimiento',
    category: FieldCategory.CATEGORICAL,
    path: ['discovery_channel'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: DISCOVERY_CHANNEL_VALUES,
    labelMap: DISCOVERY_CHANNEL_LABELS,
  },

  // ===== LLM NUMERIC FIELDS =====

  interaction_volume_daily: {
    key: 'interaction_volume_daily',
    label: 'Volumen de Interacción Diaria',
    category: FieldCategory.NUMERIC,
    path: ['interaction_volume_daily'],
    isNested: true,
    aggregable: true,
    temporal: false,
  },

  // ===== LLM BOOLEAN FIELDS (requirements.*) =====

  'requirements.confidentiality': {
    key: 'requirements.confidentiality',
    label: 'Requiere Confidencialidad',
    category: FieldCategory.BOOLEAN,
    path: ['requirements', 'confidentiality'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },

  'requirements.multilingual': {
    key: 'requirements.multilingual',
    label: 'Requiere Multiidioma',
    category: FieldCategory.BOOLEAN,
    path: ['requirements', 'multilingual'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },

  'requirements.real_time': {
    key: 'requirements.real_time',
    label: 'Requiere Tiempo Real',
    category: FieldCategory.BOOLEAN,
    path: ['requirements', 'real_time'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },

  // ===== LLM CLOSED ARRAY FIELDS (predefined enums) =====

  'requirements.personalization': {
    key: 'requirements.personalization',
    label: 'Tipos de Personalización',
    category: FieldCategory.CLOSED_ARRAY,
    path: ['requirements', 'personalization'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: PERSONALIZATION_VALUES,
    labelMap: PERSONALIZATION_LABELS,
  },

  'requirements.integrations': {
    key: 'requirements.integrations',
    label: 'Integraciones Requeridas',
    category: FieldCategory.CLOSED_ARRAY,
    path: ['requirements', 'integrations'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: INTEGRATION_VALUES,
    labelMap: INTEGRATION_LABELS,
  },

  demand_peaks: {
    key: 'demand_peaks',
    label: 'Picos de Demanda',
    category: FieldCategory.CLOSED_ARRAY,
    path: ['demand_peaks'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: DEMAND_PEAK_VALUES,
    labelMap: DEMAND_PEAK_LABELS,
  },

  query_types: {
    key: 'query_types',
    label: 'Tipos de Consultas',
    category: FieldCategory.CLOSED_ARRAY,
    path: ['query_types'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: QUERY_TYPE_VALUES,
    labelMap: QUERY_TYPE_LABELS,
  },

  tools_mentioned: {
    key: 'tools_mentioned',
    label: 'Herramientas Mencionadas',
    category: FieldCategory.CLOSED_ARRAY,
    path: ['tools_mentioned'],
    isNested: true,
    aggregable: false,
    temporal: false,
    enumValues: TOOL_VALUES,
    labelMap: TOOL_LABELS,
  },

  // ===== LLM OPEN ARRAY FIELDS (free-form text arrays) =====

  pain_points: {
    key: 'pain_points',
    label: 'Pain Points',
    category: FieldCategory.OPEN_ARRAY,
    path: ['pain_points'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },

  use_cases: {
    key: 'use_cases',
    label: 'Casos de Uso',
    category: FieldCategory.OPEN_ARRAY,
    path: ['use_cases'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },

  objections: {
    key: 'objections',
    label: 'Objeciones',
    category: FieldCategory.OPEN_ARRAY,
    path: ['objections'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },

  // ===== LLM FREE TEXT FIELDS =====

  others: {
    key: 'others',
    label: 'Otros Comentarios',
    category: FieldCategory.FREE_TEXT,
    path: ['others'],
    isNested: true,
    aggregable: false,
    temporal: false,
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get metadata for a specific field
 */
export function getFieldMetadata(key: string): FieldMetadata | null {
  return FIELD_REGISTRY[key] || null;
}

/**
 * Get all fields matching any of the provided categories
 */
export function getFieldsByCategories(categories: FieldCategory[]): FieldMetadata[] {
  const categorySet = new Set(categories);
  return Object.values(FIELD_REGISTRY).filter(f => categorySet.has(f.category));
}

/**
 * Check if a field is aggregable (can use sum/avg/min/max)
 */
export function isFieldAggregable(key: string): boolean {
  return getFieldMetadata(key)?.aggregable || false;
}

/**
 * Check if a field is a closed array (predefined enum values)
 */
export function isFieldClosedArray(key: string): boolean {
  return getFieldMetadata(key)?.category === FieldCategory.CLOSED_ARRAY;
}

