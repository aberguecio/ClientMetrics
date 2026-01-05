import { getFilterById, updateFilter, deleteFilter } from '@/lib/charts/queries';
import { mapFilterToApi } from '@/lib/charts/mappers';
import {
  successResponse,
  errorResponse,
  validateResourceExists,
  transformRequestBody,
  FILTER_FIELD_MAPPING,
} from '@/lib/api';

/**
 * GET /api/filters/[id]
 * Get a specific filter by ID
 *
 * @param {string} params.id - Filter ID
 * @returns {ApiResponse<SavedFilter>} Filter data
 * @throws {404} If filter not found
 * @throws {500} On database error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const validation = await validateResourceExists(
      () => getFilterById(params.id),
      'Filter'
    );

    if (!validation.valid) {
      return validation.error;
    }

    return successResponse(mapFilterToApi(validation.resource!));
  } catch (error) {
    console.error('[API /filters/[id] GET] Error:', error);
    return errorResponse('Failed to fetch filter', error instanceof Error ? error.message : undefined);
  }
}

/**
 * PUT /api/filters/[id]
 * Update an existing filter
 *
 * @param {string} params.id - Filter ID
 * @param {object} request.body - Fields to update
 * @param {string} request.body.name - Filter name (optional)
 * @param {string} request.body.description - Filter description (optional)
 * @param {object} request.body.filter_data - Filter configuration (optional)
 *
 * @returns {ApiResponse<SavedFilter>} Updated filter
 * @throws {404} If filter not found
 * @throws {500} On database error
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate filter exists
    const validation = await validateResourceExists(
      () => getFilterById(params.id),
      'Filter'
    );

    if (!validation.valid) {
      return validation.error;
    }

    const body = await request.json();

    // Transform request body (snake_case to camelCase)
    const updateData = transformRequestBody(body, FILTER_FIELD_MAPPING);

    const updatedFilter = await updateFilter(params.id, updateData);

    return successResponse(mapFilterToApi(updatedFilter));
  } catch (error) {
    console.error('[API /filters/[id] PUT] Error:', error);
    return errorResponse('Failed to update filter', error instanceof Error ? error.message : undefined);
  }
}

/**
 * DELETE /api/filters/[id]
 * Delete a filter
 *
 * @param {string} params.id - Filter ID
 * @returns {ApiResponse<{success: boolean}>} Success status
 * @throws {404} If filter not found
 * @throws {500} On database error
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate filter exists
    const validation = await validateResourceExists(
      () => getFilterById(params.id),
      'Filter'
    );

    if (!validation.valid) {
      return validation.error;
    }

    await deleteFilter(params.id);

    return successResponse({ success: true });
  } catch (error) {
    console.error('[API /filters/[id] DELETE] Error:', error);
    return errorResponse('Failed to delete filter', error instanceof Error ? error.message : undefined);
  }
}
