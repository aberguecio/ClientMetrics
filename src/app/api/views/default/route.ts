import { getDefaultView } from '@/lib/charts/queries';
import { successResponse, errorResponse } from '@/lib/api';

/**
 * GET /api/views/default
 * Get the default view with all its details
 *
 * @returns Default view with charts and filters, or null if no default view exists
 * @throws {500} On database error
 */
export async function GET() {
  try {
    const defaultView = await getDefaultView();

    if (!defaultView) {
      return successResponse(null);
    }

    return successResponse(defaultView);
  } catch (error) {
    console.error('[API /views/default GET] Error:', error);
    return errorResponse('Failed to fetch default view', error instanceof Error ? error.message : undefined);
  }
}
