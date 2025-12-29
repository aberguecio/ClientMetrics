import { NextResponse } from 'next/server';
import { getViewById, getFilterById, addFilterToView, removeFilterFromView } from '@/lib/charts/queries';

// POST /api/views/[id]/filters - Add a filter to a view
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate view exists
    const view = await getViewById(params.id);
    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!body.filter_id) {
      return NextResponse.json(
        { error: 'Missing required field: filter_id' },
        { status: 400 }
      );
    }

    // Validate filter exists
    const filter = await getFilterById(body.filter_id);
    if (!filter) {
      return NextResponse.json(
        { error: 'Filter not found' },
        { status: 404 }
      );
    }

    // Add the filter to the view
    const newViewFilter = await addFilterToView({
      viewId: params.id,
      filterId: body.filter_id,
    });

    return NextResponse.json(newViewFilter, { status: 201 });
  } catch (error) {
    console.error('Error adding filter to view:', error);
    return NextResponse.json(
      { error: 'Failed to add filter to view' },
      { status: 500 }
    );
  }
}

// DELETE /api/views/[id]/filters?filter_id=xxx - Remove a filter from a view
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const filterId = searchParams.get('filter_id');

    if (!filterId) {
      return NextResponse.json(
        { error: 'Missing required query parameter: filter_id' },
        { status: 400 }
      );
    }

    // Validate view exists
    const view = await getViewById(params.id);
    if (!view) {
      return NextResponse.json(
        { error: 'View not found' },
        { status: 404 }
      );
    }

    await removeFilterFromView(params.id, filterId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing filter from view:', error);
    return NextResponse.json(
      { error: 'Failed to remove filter from view' },
      { status: 500 }
    );
  }
}
