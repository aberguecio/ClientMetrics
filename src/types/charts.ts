export type ChartType = 'pie' | 'bar' | 'line' | 'area';

export type AggregationType = 'count' | 'sum' | 'avg' | 'min' | 'max';

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
  // Campos LLM
  sector?: string;
  company_size?: string;
  discovery_channel?: string;
  pain_points?: string;
  budget_range?: string;
  decision_maker?: boolean;
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
  [key: string]: any;
}
