import { getChartById, getFilterById } from '@/lib/charts/queries';
import { calculateChartData } from '@/lib/charts/calculator';
import type { SavedFilter, SavedChart } from '@/types/charts';
import { successResponse, errorResponse, validationErrorResponse, validateResourceExists, validateRequiredFields } from '@/lib/api';

/**
 * POST /api/charts/data
 * Calculate chart data with optional view and chart filters
 *
 * @param request.body.chart_id - Chart ID (required)
 * @param request.body.view_filter_ids - Array of view-level filter IDs (optional)
 * @param request.body.chart_filter_id - Chart-specific filter ID (optional)
 * @returns Calculated chart data points with metadata
 * @throws {400} If chart_id missing
 * @throws {404} If chart not found
 * @throws {500} On calculation error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🌐 [API /charts/data] Request:', JSON.stringify(body, null, 2));

    // Validate required fields
    const fieldsValidation = validateRequiredFields(body, ['chart_id']);
    if (!fieldsValidation.valid) {
      return validationErrorResponse(`Missing required fields: ${fieldsValidation.missing!.join(', ')}`);
    }

    // Validate chart exists
    const chartValidation = await validateResourceExists(
      () => getChartById(body.chart_id),
      'Chart'
    );

    if (!chartValidation.valid) {
      console.error('❌ [API /charts/data] Chart not found:', body.chart_id);
      return chartValidation.error;
    }

    const chart = chartValidation.resource!;
    console.log('✓ [API /charts/data] Chart found:', chart.name);

    // Get view filters
    const viewFilters: SavedFilter[] = [];
    if (body.view_filter_ids && Array.isArray(body.view_filter_ids)) {
      console.log('🔍 [API /charts/data] Fetching view filters:', body.view_filter_ids);
      for (const filterId of body.view_filter_ids) {
        const filter = await getFilterById(filterId);
        if (filter) {
          console.log('  ✓ Loaded filter:', filterId, filter.name, JSON.stringify(filter.filterData));
          // Transform camelCase to snake_case for SavedFilter type
          viewFilters.push({
            id: filter.id,
            name: filter.name,
            description: filter.description,
            filter_data: filter.filterData,
            created_at: filter.createdAt.toISOString(),
            updated_at: filter.updatedAt.toISOString(),
          } as SavedFilter);
        } else {
          console.warn('  ⚠️ Filter not found:', filterId);
        }
      }
    }

    // Get chart-specific filter
    let chartFilter: SavedFilter | undefined;
    if (body.chart_filter_id) {
      console.log('🔍 [API /charts/data] Fetching chart filter:', body.chart_filter_id);
      const filter = await getFilterById(body.chart_filter_id);
      if (filter) {
        console.log('  ✓ Loaded chart filter:', filter.name, JSON.stringify(filter.filterData));
        // Transform camelCase to snake_case for SavedFilter type
        chartFilter = {
          id: filter.id,
          name: filter.name,
          description: filter.description,
          filter_data: filter.filterData,
          created_at: filter.createdAt.toISOString(),
          updated_at: filter.updatedAt.toISOString(),
        } as SavedFilter;
      } else {
        console.warn('  ⚠️ Chart filter not found:', body.chart_filter_id);
      }
    }

    console.log('📊 [API /charts/data] Total view filters loaded:', viewFilters.length);
    console.log('📊 [API /charts/data] Chart filter loaded:', chartFilter ? 'Yes' : 'No');

    // Transform chart from camelCase (Drizzle) to snake_case (SavedChart type)
    // Convert null to undefined for optional fields
    const chartForCalculation: SavedChart = {
      id: chart.id,
      name: chart.name,
      description: chart.description ?? undefined,
      chart_type: chart.chartType as any,
      x_axis: chart.xAxis,
      y_axis: chart.yAxis,
      group_by: chart.groupBy,
      aggregation: chart.aggregation as any,
      time_group: (chart.timeGroup ?? undefined) as any,
      colors: chart.colors ?? undefined,
      chart_filter_id: chart.chartFilterId ?? undefined,
      k_clusters: chart.kClusters ?? undefined,
      label_field: chart.labelField ?? undefined,
      text_mode: (chart.textMode ?? undefined) as any,
      cumulative: chart.cumulative,
      created_at: chart.createdAt.toISOString(),
      updated_at: chart.updatedAt.toISOString(),
    };

    // Calculate chart data
    const data = await calculateChartData(
      chartForCalculation,
      viewFilters,
      chartFilter
    );

    console.log('✅ [API /charts/data] Success, returning', data.length, 'data points');

    return successResponse({
      data,
      metadata: {
        total: data.reduce((sum, item) => sum + item.value, 0),
        filters_applied: {
          view_filters: viewFilters.map((f) => ({ id: f.id, name: f.name })),
          chart_filter: chartFilter ? { id: chartFilter.id, name: chartFilter.name } : null,
        },
      },
    });
  } catch (error) {
    console.error('❌ [API /charts/data] Error:', error);
    return errorResponse('Failed to calculate chart data', error instanceof Error ? error.message : undefined);
  }
}
