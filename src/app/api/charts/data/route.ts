import { NextResponse } from 'next/server';
import { getChartById, getFilterById } from '@/lib/charts/queries';
import { calculateChartData } from '@/lib/charts/calculator';
import type { SavedFilter } from '@/types/charts';

// POST /api/charts/data - Calculate chart data with filters
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.chart_id) {
      return NextResponse.json(
        { error: 'Missing required field: chart_id' },
        { status: 400 }
      );
    }

    // Get the chart
    const chart = await getChartById(body.chart_id);
    if (!chart) {
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }

    // Get view filters
    const viewFilters: SavedFilter[] = [];
    if (body.view_filter_ids && Array.isArray(body.view_filter_ids)) {
      for (const filterId of body.view_filter_ids) {
        const filter = await getFilterById(filterId);
        if (filter) {
          viewFilters.push(filter as SavedFilter);
        }
      }
    }

    // Get chart-specific filter
    let chartFilter: SavedFilter | undefined;
    if (body.chart_filter_id) {
      const filter = await getFilterById(body.chart_filter_id);
      if (filter) {
        chartFilter = filter as SavedFilter;
      }
    }

    // Calculate chart data
    const data = await calculateChartData(
      {
        ...chart,
        chart_type: chart.chartType as any,
        x_axis: chart.xAxis,
        y_axis: chart.yAxis,
        group_by: chart.groupBy,
        time_group: chart.timeGroup as any,
        created_at: chart.createdAt.toISOString(),
        updated_at: chart.updatedAt.toISOString(),
      },
      viewFilters,
      chartFilter
    );

    return NextResponse.json({
      data,
      metadata: {
        total: data.reduce((sum, item) => sum + item.value, 0),
        filters_applied: {
          view_filters: viewFilters.map((f) => f.id),
          chart_filter: chartFilter?.id,
        },
      },
    });
  } catch (error) {
    console.error('Error calculating chart data:', error);
    return NextResponse.json(
      { error: 'Failed to calculate chart data' },
      { status: 500 }
    );
  }
}
