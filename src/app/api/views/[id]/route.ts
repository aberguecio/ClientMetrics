import {
  getViewWithDetails,
  getViewById,
  updateView,
  deleteView,
  addFilterToView,
  removeFilterFromView,
} from '@/lib/charts/queries';
import { mapViewWithDetailsToApi, mapViewToApi } from '@/lib/charts/mappers';
import {
  successResponse,
  errorResponse,
  validateResourceExists,
  transformRequestBody,
  VIEW_FIELD_MAPPING,
} from '@/lib/api';

/**
 * GET /api/views/[id]
 * Get a view with all its charts and filters
 *
 * @param params.id - View ID
 * @returns View with full details (charts and filters)
 * @throws {404} If view not found
 * @throws {500} On database error
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const viewWithDetails = await getViewWithDetails(params.id);

    if (!viewWithDetails) {
      return errorResponse('View not found', undefined, 404);
    }

    return successResponse(mapViewWithDetailsToApi(viewWithDetails));
  } catch (error) {
    console.error('[API /views/[id] GET] Error:', error);
    return errorResponse('Failed to fetch view', error instanceof Error ? error.message : undefined);
  }
}

/**
 * PUT /api/views/[id]
 * Update an existing view
 *
 * @param params.id - View ID
 * @param request.body - Fields to update (name, objective, is_default, filter_ids)
 * @returns Updated view with filters
 * @throws {404} If view not found
 * @throws {500} On database error
 */
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate view exists
    const validation = await validateResourceExists(
      () => getViewById(params.id),
      'View'
    );

    if (!validation.valid) {
      return validation.error;
    }

    const body = await request.json();

    // Transform request body (snake_case to camelCase)
    const updateData = transformRequestBody(body, VIEW_FIELD_MAPPING);

    // Update basic fields (name, objective, is_default)
    const updatedView = await updateView(params.id, updateData);

    // Gestionar actualización de filtros si se proporcionaron
    if (body.filter_ids !== undefined && Array.isArray(body.filter_ids)) {
      // Obtener filtros actuales de la vista
      const viewWithDetails = await getViewWithDetails(params.id);
      const currentFilterIds = viewWithDetails.filters.map(f => f.id);
      const newFilterIds = body.filter_ids as string[];

      // Determinar qué filtros remover
      const toRemove = currentFilterIds.filter(id => !newFilterIds.includes(id));

      // Determinar qué filtros agregar
      const toAdd = newFilterIds.filter(id => !currentFilterIds.includes(id));

      // Ejecutar remociones
      for (const filterId of toRemove) {
        await removeFilterFromView(params.id, filterId);
      }

      // Ejecutar adiciones
      for (const filterId of toAdd) {
        await addFilterToView({ viewId: params.id, filterId });
      }
    }

    // Retornar vista actualizada con filtros
    const finalView = await getViewWithDetails(params.id);
    return successResponse(mapViewWithDetailsToApi(finalView));
  } catch (error) {
    console.error('[API /views/[id] PUT] Error:', error);
    return errorResponse('Failed to update view', error instanceof Error ? error.message : undefined);
  }
}

/**
 * DELETE /api/views/[id]
 * Delete a view (cascade deletes associated view_charts and view_filters)
 *
 * @param params.id - View ID
 * @returns Success status
 * @throws {404} If view not found
 * @throws {500} On database error
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate view exists
    const validation = await validateResourceExists(
      () => getViewById(params.id),
      'View'
    );

    if (!validation.valid) {
      return validation.error;
    }

    // Delete the view (cascade will handle view_charts and view_filters)
    await deleteView(params.id);

    return successResponse({ success: true });
  } catch (error) {
    console.error('[API /views/[id] DELETE] Error:', error);
    return errorResponse('Failed to delete view', error instanceof Error ? error.message : undefined);
  }
}
