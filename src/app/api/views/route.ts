import { getAllViews, createView, addChartToView, addFilterToView } from '@/lib/charts/queries';
import { mapViewToApi } from '@/lib/charts/mappers';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  validateRequiredFields,
} from '@/lib/api';

/**
 * GET /api/views
 * List all saved views
 *
 * @returns Array of views
 * @throws {500} On database error
 */
export async function GET() {
  try {
    const views = await getAllViews();
    const mappedViews = views.map(mapViewToApi);
    return successResponse(mappedViews);
  } catch (error) {
    console.error('[API /views GET] Error:', error);
    return errorResponse('Failed to fetch views', error instanceof Error ? error.message : undefined);
  }
}

/**
 * POST /api/views
 * Create a new view
 *
 * @param request.body.name - View name (required)
 * @param request.body.objective - View objective/description (optional)
 * @param request.body.is_default - Set as default view (optional)
 * @param request.body.chart_ids - Array of chart IDs to add (optional)
 * @param request.body.filter_ids - Array of filter IDs to add (optional)
 * @returns Created view
 * @throws {400} If required fields are missing
 * @throws {500} On database error
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    const validation = validateRequiredFields(body, ['name']);
    if (!validation.valid) {
      return validationErrorResponse(
        `Missing required fields: ${validation.missing!.join(', ')}`
      );
    }

    // Create the view
    const newView = await createView({
      name: body.name,
      objective: body.objective || null,
      isDefault: body.is_default || false,
    });

    // Add charts to the view if provided
    if (body.chart_ids && Array.isArray(body.chart_ids)) {
      for (let i = 0; i < body.chart_ids.length; i++) {
        await addChartToView({
          viewId: newView.id,
          chartId: body.chart_ids[i],
          position: i,
          width: 'full', // Default width
          chartFilterId: null,
        });
      }
    }

    // Add filters to the view if provided
    if (body.filter_ids && Array.isArray(body.filter_ids)) {
      for (const filterId of body.filter_ids) {
        await addFilterToView({
          viewId: newView.id,
          filterId,
        });
      }
    }

    return successResponse(mapViewToApi(newView), 201);
  } catch (error) {
    console.error('[API /views POST] Error:', error);
    return errorResponse('Failed to create view', error instanceof Error ? error.message : undefined);
  }
}
