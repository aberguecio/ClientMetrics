import { NextResponse } from 'next/server';
import { addChartToView, removeChartFromView, getViewById } from '@/lib/charts/queries';

// POST /api/views/[id]/charts - Add a chart to a view
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
    if (!body.chart_id) {
      return NextResponse.json(
        { error: 'Missing required field: chart_id' },
        { status: 400 }
      );
    }

    // Add chart to view
    await addChartToView({
      viewId: params.id,
      chartId: body.chart_id,
      position: body.position || 0,
      width: body.width || 'full',
      chartFilterId: body.chart_filter_id || null,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Error adding chart to view:', error);
    return NextResponse.json(
      { error: 'Failed to add chart to view' },
      { status: 500 }
    );
  }
}

// DELETE /api/views/[id]/charts - Remove a chart from a view
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const chartId = searchParams.get('chart_id');

    if (!chartId) {
      return NextResponse.json(
        { error: 'Missing required parameter: chart_id' },
        { status: 400 }
      );
    }

    await removeChartFromView(params.id, chartId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing chart from view:', error);
    return NextResponse.json(
      { error: 'Failed to remove chart from view' },
      { status: 500 }
    );
  }
}
