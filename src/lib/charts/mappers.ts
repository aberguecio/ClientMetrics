/**
 * Mappers to convert between database camelCase and API snake_case
 */

import type { SavedChart as DbChart, SavedFilter as DbFilter, SavedView as DbView } from '@/lib/db/schema';
import type { SavedChart, SavedFilter, SavedView } from '@/types/charts';

/**
 * Map database chart (camelCase) to API chart (snake_case)
 */
export function mapChartToApi(chart: DbChart): SavedChart {
  return {
    id: chart.id,
    name: chart.name,
    description: chart.description ?? undefined,
    chart_type: chart.chartType as any,
    x_axis: chart.xAxis,
    y_axis: chart.yAxis,
    group_by: chart.groupBy,
    aggregation: chart.aggregation as any,
    time_group: chart.timeGroup as any,
    colors: chart.colors ?? undefined,
    k_clusters: chart.kClusters ?? undefined,
    label_field: chart.labelField ?? undefined,
    text_mode: chart.textMode as any,
    cumulative: chart.cumulative,
    created_at: chart.createdAt.toISOString(),
    updated_at: chart.updatedAt.toISOString(),
  };
}

/**
 * Map database filter (camelCase) to API filter (snake_case)
 */
export function mapFilterToApi(filter: DbFilter): SavedFilter {
  return {
    id: filter.id,
    name: filter.name,
    description: filter.description ?? undefined,
    filter_data: filter.filterData as any,
    created_at: filter.createdAt.toISOString(),
    updated_at: filter.updatedAt.toISOString(),
  };
}

/**
 * Map database view (camelCase) to API view (snake_case)
 */
export function mapViewToApi(view: DbView): SavedView {
  return {
    id: view.id,
    name: view.name,
    objective: view.objective ?? undefined,
    is_default: view.isDefault,
    created_at: view.createdAt.toISOString(),
    updated_at: view.updatedAt.toISOString(),
  };
}

/**
 * Map ViewWithDetails from database to API format
 */
export function mapViewWithDetailsToApi(viewData: any): any {
  return {
    ...mapViewToApi(viewData),
    charts: viewData.charts.map((chart: any) => ({
      ...mapChartToApi(chart),
      position: chart.position,
      width: chart.width,
      chart_filter: chart.chart_filter ? mapFilterToApi(chart.chart_filter) : null,
    })),
    filters: viewData.filters.map(mapFilterToApi),
  };
}
