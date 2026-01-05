import { addChartToView, removeChartFromView, getViewById } from '@/lib/charts/queries';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  validateResourceExists,
  validateRequiredFields,
} from '@/lib/api';

/**
 * POST /api/views/[id]/charts
 * Add a chart to a view
 *
 * @param params.id - View ID
 * @param request.body.chart_id - Chart ID to add (required)
 * @param request.body.position - Position in view (optional, default: 0)
 * @param request.body.width - Chart width: full, half, third (optional, default: 'full')
 * @param request.body.chart_filter_id - Optional filter for this chart (optional)
 * @returns Success status
 * @throws {404} If view not found
 * @throws {400} If required fields missing
 * @throws {500} On database error
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate view exists
    const viewValidation = await validateResourceExists(
      () => getViewById(params.id),
      'View'
    );

    if (!viewValidation.valid) {
      return viewValidation.error;
    }

    // Validate required fields
    const fieldsValidation = validateRequiredFields(body, ['chart_id']);
    if (!fieldsValidation.valid) {
      return validationErrorResponse(
        `Missing required fields: ${fieldsValidation.missing!.join(', ')}`
      );
    }

    // Add chart to view
    await addChartToView({
      viewId: params.id,
      chartId: body.chart_id,
      position: body.position || 0,
      width: body.width || 'full',
      chartFilterId: body.chart_filter_id || null,
    });

    return successResponse({ success: true }, 201);
  } catch (error) {
    console.error('[API /views/[id]/charts POST] Error:', error);
    return errorResponse('Failed to add chart to view', error instanceof Error ? error.message : undefined);
  }
}

/**
 * DELETE /api/views/[id]/charts?chart_id=xxx
 * Remove a chart from a view
 * NOTE: This endpoint uses query parameter. Prefer DELETE /api/views/[id]/charts/[chartId]
 *
 * @param params.id - View ID
 * @param query.chart_id - Chart ID to remove (required)
 * @returns Success status
 * @throws {400} If chart_id parameter missing
 * @throws {500} On database error
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chartId = searchParams.get('chart_id');

    if (!chartId) {
      return validationErrorResponse('Missing required parameter: chart_id');
    }

    await removeChartFromView(params.id, chartId);

    return successResponse({ success: true });
  } catch (error) {
    console.error('[API /views/[id]/charts DELETE] Error:', error);
    return errorResponse('Failed to remove chart from view', error instanceof Error ? error.message : undefined);
  }
}
