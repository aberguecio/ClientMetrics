import { NextResponse } from 'next/server';
import { getFilterById, updateFilter, deleteFilter } from '@/lib/charts/queries';
import { mapFilterToApi } from '@/lib/charts/mappers';

// GET /api/filters/[id] - Get a specific filter
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const filter = await getFilterById(params.id);

    if (!filter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapFilterToApi(filter));
  } catch (error) {
    console.error('Error fetching filter:', error);
    return NextResponse.json(
      { error: 'Failed to fetch filter' },
      { status: 500 }
    );
  }
}

// PUT /api/filters/[id] - Update a filter
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate filter exists
    const existing = await getFilterById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.filter_data !== undefined) updateData.filterData = body.filter_data;

    const updatedFilter = await updateFilter(params.id, updateData);

    return NextResponse.json(mapFilterToApi(updatedFilter));
  } catch (error) {
    console.error('Error updating filter:', error);
    return NextResponse.json(
      { error: 'Failed to update filter' },
      { status: 500 }
    );
  }
}

// DELETE /api/filters/[id] - Delete a filter
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate filter exists
    const existing = await getFilterById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    await deleteFilter(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting filter:', error);
    return NextResponse.json(
      { error: 'Failed to delete filter' },
      { status: 500 }
    );
  }
}
