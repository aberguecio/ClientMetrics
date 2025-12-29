import { NextResponse } from 'next/server';
import { getAllFilters, createFilter } from '@/lib/charts/queries';
import { mapFilterToApi } from '@/lib/charts/mappers';

// GET /api/filters - List all filters
export async function GET() {
  try {
    const filters = await getAllFilters();
    const mappedFilters = filters.map(mapFilterToApi);
    return NextResponse.json(mappedFilters);
  } catch (error) {
    console.error('Error fetching filters:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filters' },
      { status: 500 }
    );
  }
}

// POST /api/filters - Create a new filter
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    const newFilter = await createFilter({
      name: body.name,
      description: body.description || null,
      filterData: body.filter_data || {},
    });

    return NextResponse.json(mapFilterToApi(newFilter), { status: 201 });
  } catch (error) {
    console.error('Error creating filter:', error);
    return NextResponse.json(
      { error: 'Failed to create filter' },
      { status: 500 }
    );
  }
}
