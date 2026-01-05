import { NextResponse } from 'next/server';
import { removeChartFromView } from '@/lib/charts/queries';

// DELETE /api/views/[id]/charts/[chartId] - Remove a chart from a view
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; chartId: string } }
) {
  try {
    await removeChartFromView(params.id, params.chartId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing chart from view:', error);
    return NextResponse.json(
      { error: 'Failed to remove chart from view' },
      { status: 500 }
    );
  }
}
