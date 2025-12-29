import { NextResponse } from 'next/server';
import { getAllCharts, createChart } from '@/lib/charts/queries';
import { mapChartToApi } from '@/lib/charts/mappers';

// GET /api/charts - List all charts
export async function GET() {
  try {
    const charts = await getAllCharts();
    const mappedCharts = charts.map(mapChartToApi);
    return NextResponse.json(mappedCharts);
  } catch (error) {
    console.error('Error fetching charts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch charts' },
      { status: 500 }
    );
  }
}

// POST /api/charts - Create a new chart
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.chart_type || !body.x_axis || !body.y_axis || !body.group_by) {
      return NextResponse.json(
        { error: 'Missing required fields: name, chart_type, x_axis, y_axis, group_by' },
        { status: 400 }
      );
    }

    // Validate chart_type
    const validChartTypes = ['pie', 'bar', 'line', 'area'];
    if (!validChartTypes.includes(body.chart_type)) {
      return NextResponse.json(
        { error: 'Invalid chart_type. Must be one of: pie, bar, line, area' },
        { status: 400 }
      );
    }

    // Validate aggregation
    const validAggregations = ['count', 'sum', 'avg', 'min', 'max'];
    if (body.aggregation && !validAggregations.includes(body.aggregation)) {
      return NextResponse.json(
        { error: 'Invalid aggregation. Must be one of: count, sum, avg, min, max' },
        { status: 400 }
      );
    }

    const newChart = await createChart({
      name: body.name,
      description: body.description || null,
      chartType: body.chart_type,
      xAxis: body.x_axis,
      yAxis: body.y_axis,
      groupBy: body.group_by,
      aggregation: body.aggregation || 'count',
      timeGroup: body.time_group || null,
      colors: body.colors || null,
    });

    return NextResponse.json(mapChartToApi(newChart), { status: 201 });
  } catch (error) {
    console.error('Error creating chart:', error);
    return NextResponse.json(
      { error: 'Failed to create chart' },
      { status: 500 }
    );
  }
}
