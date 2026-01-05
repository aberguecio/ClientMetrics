import { NextResponse } from 'next/server';
import { getChartById, updateChart, deleteChart } from '@/lib/charts/queries';
import { mapChartToApi } from '@/lib/charts/mappers';

// GET /api/charts/[id] - Get a specific chart
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const chart = await getChartById(params.id);

    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(mapChartToApi(chart));
  } catch (error) {
    console.error('Error fetching chart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chart' },
      { status: 500 }
    );
  }
}

// PUT /api/charts/[id] - Update a chart
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    // Validate chart exists
    const existing = await getChartById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Validate chart_type if provided
    if (body.chart_type) {
      const validChartTypes = ['pie', 'bar', 'line', 'area', 'wordcloud', 'vector_cluster'];
      if (!validChartTypes.includes(body.chart_type)) {
        return NextResponse.json(
          { error: 'Invalid chart_type. Must be one of: pie, bar, line, area, wordcloud, vector_cluster' },
          { status: 400 }
        );
      }
    }

    // Validate aggregation if provided
    if (body.aggregation) {
      const validAggregations = ['count', 'sum', 'avg', 'min', 'max'];
      if (!validAggregations.includes(body.aggregation)) {
        return NextResponse.json(
          { error: 'Invalid aggregation. Must be one of: count, sum, avg, min, max' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.chart_type !== undefined) updateData.chartType = body.chart_type;
    if (body.x_axis !== undefined) updateData.xAxis = body.x_axis;
    if (body.y_axis !== undefined) updateData.yAxis = body.y_axis;
    if (body.group_by !== undefined) updateData.groupBy = body.group_by;
    if (body.aggregation !== undefined) updateData.aggregation = body.aggregation;
    if (body.time_group !== undefined) updateData.timeGroup = body.time_group;
    if (body.colors !== undefined) updateData.colors = body.colors;
    if (body.k_clusters !== undefined) updateData.kClusters = body.k_clusters;
    if (body.label_field !== undefined) updateData.labelField = body.label_field;
    if (body.text_mode !== undefined) updateData.textMode = body.text_mode;
    if (body.cumulative !== undefined) updateData.cumulative = body.cumulative;

    const updatedChart = await updateChart(params.id, updateData);

    return NextResponse.json(mapChartToApi(updatedChart));
  } catch (error) {
    console.error('Error updating chart:', error);
    return NextResponse.json(
      { error: 'Failed to update chart' },
      { status: 500 }
    );
  }
}

// DELETE /api/charts/[id] - Delete a chart
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Validate chart exists
    const existing = await getChartById(params.id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    await deleteChart(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting chart:', error);
    return NextResponse.json(
      { error: 'Failed to delete chart' },
      { status: 500 }
    );
  }
}
