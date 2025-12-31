import { NextResponse } from 'next/server';
import { getAllCharts, createChart, addChartToView, getViewWithDetails } from '@/lib/charts/queries';
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

    // Validate chart_type first
    const validChartTypes = ['pie', 'bar', 'line', 'area', 'wordcloud'];
    if (!body.chart_type || !validChartTypes.includes(body.chart_type)) {
      return NextResponse.json(
        { error: 'Invalid or missing chart_type. Must be one of: pie, bar, line, area, wordcloud' },
        { status: 400 }
      );
    }

    // Validate required fields based on chart type
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Chart-type specific validation
    if (body.chart_type === 'pie') {
      if (!body.group_by || !body.y_axis) {
        return NextResponse.json(
          { error: 'Pie charts require: group_by and y_axis' },
          { status: 400 }
        );
      }
    } else if (body.chart_type === 'wordcloud') {
      if (!body.x_axis) {
        return NextResponse.json(
          { error: 'Wordcloud charts require: x_axis (text field to analyze)' },
          { status: 400 }
        );
      }
    } else {
      // bar, line, area
      if (!body.x_axis || !body.y_axis) {
        return NextResponse.json(
          { error: `${body.chart_type} charts require: x_axis and y_axis` },
          { status: 400 }
        );
      }
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
      xAxis: body.x_axis || '',
      yAxis: body.y_axis || 'count',
      groupBy: body.group_by || '',
      aggregation: body.aggregation || 'count',
      timeGroup: body.time_group || null,
      colors: body.colors || null,
    });

    // Auto-add to view if view_id is provided
    if (body.view_id) {
      try {
        // Get current view to calculate position
        const viewData = await getViewWithDetails(body.view_id);
        const maxPosition = viewData?.charts && viewData.charts.length > 0
          ? Math.max(...viewData.charts.map((c: any) => c.position || 0))
          : -1;

        await addChartToView({
          viewId: body.view_id,
          chartId: newChart.id,
          position: maxPosition + 1,
          width: body.width || 'full',
          chartFilterId: body.chart_filter_id || null,
        });
      } catch (addError) {
        console.error('Error adding chart to view:', addError);
        // Continue anyway - the chart was created successfully
      }
    }

    return NextResponse.json(mapChartToApi(newChart), { status: 201 });
  } catch (error) {
    console.error('Error creating chart:', error);
    return NextResponse.json(
      { error: 'Failed to create chart' },
      { status: 500 }
    );
  }
}
