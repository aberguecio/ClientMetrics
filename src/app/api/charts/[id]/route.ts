import { getChartById, updateChart, deleteChart } from '@/lib/charts/queries';
import { mapChartToApi } from '@/lib/charts/mappers';
import {
  successResponse,
  errorResponse,
  validateResourceExists,
  validateEnumValue,
  transformRequestBody,
  CHART_FIELD_MAPPING,
  VALID_CHART_TYPES,
  VALID_AGGREGATIONS,
} from '@/lib/api';

/**
 * GET /api/charts/[id]
 * Get a specific chart by ID
 *
 * @param params.id - Chart ID
 * @returns Chart data
 * @throws {404} If chart not found
 * @throws {500} On database error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const validation = await validateResourceExists(
      () => getChartById(params.id),
      'Chart'
    );

    if (!validation.valid) {
      return validation.error;
    }

    return successResponse(mapChartToApi(validation.resource!));
  } catch (error) {
    console.error('[API /charts/[id] GET] Error:', error);
    return errorResponse('Failed to fetch chart', error instanceof Error ? error.message : undefined);
  }
}

/**
 * PUT /api/charts/[id]
 * Update an existing chart
 *
 * @param params.id - Chart ID
 * @param request.body - Fields to update
 * @returns Updated chart
 * @throws {404} If chart not found
 * @throws {400} If validation fails
 * @throws {500} On database error
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate chart exists
    const validation = await validateResourceExists(
      () => getChartById(params.id),
      'Chart'
    );

    if (!validation.valid) {
      return validation.error;
    }

    const body = await request.json();

    // Validate chart_type if provided
    const chartTypeValidation = validateEnumValue(body.chart_type, VALID_CHART_TYPES, 'chart_type');
    if (!chartTypeValidation.valid) {
      return errorResponse(chartTypeValidation.error!, undefined, 400);
    }

    // Validate aggregation if provided
    const aggregationValidation = validateEnumValue(body.aggregation, VALID_AGGREGATIONS, 'aggregation');
    if (!aggregationValidation.valid) {
      return errorResponse(aggregationValidation.error!, undefined, 400);
    }

    // Transform request body (snake_case to camelCase)
    const updateData = transformRequestBody(body, CHART_FIELD_MAPPING);

    const updatedChart = await updateChart(params.id, updateData);

    return successResponse(mapChartToApi(updatedChart));
  } catch (error) {
    console.error('[API /charts/[id] PUT] Error:', error);
    return errorResponse('Failed to update chart', error instanceof Error ? error.message : undefined);
  }
}

/**
 * DELETE /api/charts/[id]
 * Delete a chart
 *
 * @param params.id - Chart ID
 * @returns Success status
 * @throws {404} If chart not found
 * @throws {500} On database error
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate chart exists
    const validation = await validateResourceExists(
      () => getChartById(params.id),
      'Chart'
    );

    if (!validation.valid) {
      return validation.error;
    }

    await deleteChart(params.id);

    return successResponse({ success: true });
  } catch (error) {
    console.error('[API /charts/[id] DELETE] Error:', error);
    return errorResponse('Failed to delete chart', error instanceof Error ? error.message : undefined);
  }
}
