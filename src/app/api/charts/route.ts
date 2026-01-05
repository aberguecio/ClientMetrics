import { getAllCharts, createChart, addChartToView, getViewWithDetails } from '@/lib/charts/queries';
import { mapChartToApi } from '@/lib/charts/mappers';
import { validateChartConfig, getValidationErrorMessages } from '@/lib/charts/validation';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';

/**
 * GET /api/charts
 * List all saved charts
 *
 * @returns {ApiResponse<SavedChart[]>} Array of charts
 * @throws {500} On database error
 */
export async function GET() {
  try {
    const charts = await getAllCharts();
    const mappedCharts = charts.map(mapChartToApi);
    return successResponse(mappedCharts);
  } catch (error) {
    console.error('[API /charts GET] Error:', error);
    return errorResponse('Failed to fetch charts', error instanceof Error ? error.message : undefined);
  }
}

/**
 * POST /api/charts
 * Create a new chart
 *
 * @param {object} request.body - Chart data
 * @param {string} request.body.name - Chart name (required)
 * @param {string} request.body.chart_type - Chart type: pie, bar, line, area, wordcloud, vector_cluster (required)
 * @param {string} request.body.x_axis - X-axis field (required)
 * @param {string} request.body.y_axis - Y-axis field (optional, default: 'count')
 * @param {string} request.body.group_by - Group by field (optional)
 * @param {string} request.body.aggregation - Aggregation: count, sum, avg, min, max (optional, default: 'count')
 * @param {string} request.body.view_id - Auto-add to this view (optional)
 *
 * @returns {ApiResponse<SavedChart>} Created chart
 * @throws {400} If validation fails
 * @throws {500} On database error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Use centralized validation
    const validationResult = validateChartConfig({
      name: body.name || '',
      chart_type: body.chart_type,
      x_axis: body.x_axis || '',
      y_axis: body.y_axis || 'count',
      group_by: body.group_by || '',
      aggregation: body.aggregation || 'count',
    });

    if (!validationResult.valid) {
      const errorMessages = getValidationErrorMessages(validationResult);
      return validationErrorResponse(
        'Invalid chart configuration',
        {
          errors: validationResult.errors,
          messages: errorMessages,
        }
      );
    }

    // Log warnings if any (non-blocking)
    if (validationResult.warnings.length > 0) {
      console.warn('[API /charts POST] Validation warnings:', validationResult.warnings);
    }

    const newChart = await createChart({
      name: body.name,
      description: body.description || null,
      chartType: body.chart_type,
      xAxis: body.x_axis || '',
      yAxis: body.y_axis || 'count',
      groupBy: body.group_by || '',
      aggregation: body.aggregation || 'count',
      timeGroup: body.time_group || null,
      colors: body.colors || null,
      kClusters: body.k_clusters || null,
      labelField: body.label_field || null,
      textMode: body.text_mode || null,
      cumulative: body.cumulative || false,
    });

    // Auto-add to view if view_id is provided
    if (body.view_id) {
      try {
        // Get current view to calculate position
        const viewData = await getViewWithDetails(body.view_id);
        const maxPosition = viewData?.charts && viewData.charts.length > 0
          ? Math.max(...viewData.charts.map((c: any) => c.position || 0))
          : -1;

        await addChartToView({
          viewId: body.view_id,
          chartId: newChart.id,
          position: maxPosition + 1,
          width: body.width || 'full',
          chartFilterId: body.chart_filter_id || null,
        });
      } catch (addError) {
        console.error('[API /charts POST] Error adding chart to view:', addError);
        // Continue anyway - the chart was created successfully
      }
    }

    return successResponse(mapChartToApi(newChart), 201);
  } catch (error) {
    console.error('[API /charts POST] Error:', error);
    return errorResponse('Failed to create chart', error instanceof Error ? error.message : undefined);
  }
}
