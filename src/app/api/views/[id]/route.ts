import { NextResponse } from 'next/server';
import { getViewWithDetails, getViewById, updateView, deleteView } from '@/lib/charts/queries';
import { mapViewWithDetailsToApi, mapViewToApi } from '@/lib/charts/mappers';

// GET /api/views/[id] - Get a view with all its charts and filters
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const viewWithDetails = await getViewWithDetails(params.id);

    if (!viewWithDetails) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapViewWithDetailsToApi(viewWithDetails));
  } catch (error) {
    console.error('Error fetching view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch view' },
      { status: 500 }
    );
  }
}

// PUT /api/views/[id] - Update a view
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate view exists
    const existing = await getViewById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.objective !== undefined) updateData.objective = body.objective;
    if (body.is_default !== undefined) updateData.isDefault = body.is_default;

    const updatedView = await updateView(params.id, updateData);

    return NextResponse.json(mapViewToApi(updatedView));
  } catch (error) {
    console.error('Error updating view:', error);
    return NextResponse.json(
      { error: 'Failed to update view' },
      { status: 500 }
    );
  }
}

// DELETE /api/views/[id] - Delete a view
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate view exists
    const existing = await getViewById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // Delete the view (cascade will handle view_charts and view_filters)
    await deleteView(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting view:', error);
    return NextResponse.json(
      { error: 'Failed to delete view' },
      { status: 500 }
    );
  }
}
