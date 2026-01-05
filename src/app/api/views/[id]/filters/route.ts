import { getViewById, getFilterById, addFilterToView, removeFilterFromView } from '@/lib/charts/queries';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  validateResourceExists,
  validateRequiredFields,
} from '@/lib/api';

/**
 * POST /api/views/[id]/filters
 * Add a filter to a view
 *
 * @param params.id - View ID
 * @param request.body.filter_id - Filter ID to add (required)
 * @returns Created view_filter relationship
 * @throws {404} If view or filter not found
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
    const fieldsValidation = validateRequiredFields(body, ['filter_id']);
    if (!fieldsValidation.valid) {
      return validationErrorResponse(
        `Missing required fields: ${fieldsValidation.missing!.join(', ')}`
      );
    }

    // Validate filter exists
    const filterValidation = await validateResourceExists(
      () => getFilterById(body.filter_id),
      'Filter'
    );

    if (!filterValidation.valid) {
      return filterValidation.error;
    }

    // Add the filter to the view
    const newViewFilter = await addFilterToView({
      viewId: params.id,
      filterId: body.filter_id,
    });

    return successResponse(newViewFilter, 201);
  } catch (error) {
    console.error('[API /views/[id]/filters POST] Error:', error);
    return errorResponse('Failed to add filter to view', error instanceof Error ? error.message : undefined);
  }
}

/**
 * DELETE /api/views/[id]/filters?filter_id=xxx
 * Remove a filter from a view
 *
 * @param params.id - View ID
 * @param query.filter_id - Filter ID to remove (required)
 * @returns Success status
 * @throws {404} If view not found
 * @throws {400} If filter_id parameter missing
 * @throws {500} On database error
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get('filter_id');

    if (!filterId) {
      return validationErrorResponse('Missing required query parameter: filter_id');
    }

    // Validate view exists
    const viewValidation = await validateResourceExists(
      () => getViewById(params.id),
      'View'
    );

    if (!viewValidation.valid) {
      return viewValidation.error;
    }

    await removeFilterFromView(params.id, filterId);

    return successResponse({ success: true });
  } catch (error) {
    console.error('[API /views/[id]/filters DELETE] Error:', error);
    return errorResponse('Failed to remove filter from view', error instanceof Error ? error.message : undefined);
  }
}
