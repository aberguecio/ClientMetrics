import { getAllFilters, createFilter } from '@/lib/charts/queries';
import { mapFilterToApi } from '@/lib/charts/mappers';
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
  validateRequiredFields,
} from '@/lib/api';

/**
 * GET /api/filters
 * List all saved filters
 *
 * @returns {ApiResponse<SavedFilter[]>} Array of filters
 * @throws {500} On database error
 */
export async function GET() {
  try {
    const filters = await getAllFilters();
    const mappedFilters = filters.map(mapFilterToApi);
    return successResponse(mappedFilters);
  } catch (error) {
    console.error('[API /filters GET] Error:', error);
    return errorResponse('Failed to fetch filters', error instanceof Error ? error.message : undefined);
  }
}

/**
 * POST /api/filters
 * Create a new filter
 *
 * @param {object} request.body - Filter data
 * @param {string} request.body.name - Filter name (required)
 * @param {string} request.body.description - Filter description (optional)
 * @param {object} request.body.filter_data - Filter configuration (optional)
 *
 * @returns {ApiResponse<SavedFilter>} Created filter
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

    const newFilter = await createFilter({
      name: body.name,
      description: body.description || null,
      filterData: body.filter_data || {},
    });

    return successResponse(mapFilterToApi(newFilter), 201);
  } catch (error) {
    console.error('[API /filters POST] Error:', error);
    return errorResponse('Failed to create filter', error instanceof Error ? error.message : undefined);
  }
}
