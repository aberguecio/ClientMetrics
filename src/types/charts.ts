export type ChartType = 'pie' | 'bar' | 'line' | 'area' | 'wordcloud' | 'vector_cluster';

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median';

export type TimeGrouping = 'day' | 'week' | 'month' | 'quarter' | 'year';

export interface SavedChart {
  id: string;
  name: string;
  description?: string;
  chart_type: ChartType;
  x_axis: string;
  y_axis: string;
  group_by: string;
  aggregation: AggregationType;
  time_group?: TimeGrouping;
  colors?: string;  // Comma-separated colors
  chart_filter_id?: string;  // Optional filter for this chart
  // New fields for vector clustering
  k_clusters?: number;
  label_field?: string;
  // New fields for chart enhancements
  text_mode?: 'words' | 'phrases';  // Word cloud: single words vs complete phrases
  cumulative?: boolean;  // Line/Area: show cumulative values (running total)
  created_at: string;
  updated_at: string;
}

// Estructura del filtro (almacenada en JSONB)
export interface FilterData {
  // Campos base
  sales_rep?: string;
  closed?: boolean;
  date_from?: string;
  date_to?: string;

  // Campos LLM - Enums cerrados (single value)
  sector?: string;
  company_size?: string;
  discovery_channel?: string;

  // Campos LLM - Arrays abiertos (membership test)
  pain_points?: string;
  budget_range?: string;
  decision_maker?: boolean;

  // NEW: Campos LLM - Booleanos
  'requirements.confidentiality'?: boolean;
  'requirements.multilingual'?: boolean;
  'requirements.real_time'?: boolean;

  // NEW: Campos LLM - Arrays cerrados (multi-select OR)
  'requirements.personalization'?: string[]; // Array of selected values
  'requirements.integrations'?: string[];
  demand_peaks?: string[];
  query_types?: string[];
  tools_mentioned?: string[];

  [key: string]: any; // Permite futuros campos sin migración de schema
}

export interface SavedFilter {
  id: string;
  name: string;
  description?: string;
  filter_data: FilterData;
  created_at: string;
  updated_at: string;
}

export interface SavedView {
  id: string;
  name: string;
  objective?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface ViewChart {
  id: string;
  view_id: string;
  chart_id: string;
  position: number;
  width: 'full' | 'half' | 'third';
  chart_filter_id?: string;  // Filtro específico del gráfico (opcional)
}

export interface ViewWithDetails extends SavedView {
  charts: Array<SavedChart & { chart_filter?: SavedFilter }>;
  filters: SavedFilter[];
}

// Tipo helper para merge de filtros
export type MergedFilter = FilterData;

// Tipo para datos de gráfico (formato Recharts)
export interface ChartData {
  label: string;
  value: number;
  originalValue?: number; // Store non-cumulative value for tooltip (line/area charts)
  [key: string]: any;
}

// Tipo para datos de word cloud
export interface WordCloudData {
  text: string;
  value: number;
}

// Tipo para opciones dinámicas de filtros
export interface FilterOptions {
  salesReps: string[];
  sectors: string[];
  companySizes: string[];
  discoveryChannels: string[];
}
