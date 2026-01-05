import { NextResponse } from 'next/server';
import { getAllCharts, createChart, addChartToView, getViewWithDetails } from '@/lib/charts/queries';
import { mapChartToApi } from '@/lib/charts/mappers';
import { validateChartConfig, getValidationErrorMessages } from '@/lib/charts/validation';

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

    // Use centralized validation
    const validationResult = validateChartConfig({
      name: body.name || '',
      chart_type: body.chart_type,
      x_axis: body.x_axis || '',
      y_axis: body.y_axis || 'count',
      group_by: body.group_by || '',
      aggregation: body.aggregation || 'count',
    });

    if (!validationResult.valid) {
      const errorMessages = getValidationErrorMessages(validationResult);
      return NextResponse.json(
        {
          error: 'Invalid chart configuration',
          details: validationResult.errors,
          messages: errorMessages,
        },
        { status: 400 }
      );
    }

    // Log warnings if any (non-blocking)
    if (validationResult.warnings.length > 0) {
      console.warn('[Chart API] Validation warnings:', validationResult.warnings);
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
      kClusters: body.k_clusters || null,
      labelField: body.label_field || null,
      textMode: body.text_mode || null,
      cumulative: body.cumulative || false,
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
