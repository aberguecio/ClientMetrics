import { NextResponse } from 'next/server';
import { getChartById, getFilterById } from '@/lib/charts/queries';
import { calculateChartData } from '@/lib/charts/calculator';
import type { SavedFilter } from '@/types/charts';

// POST /api/charts/data - Calculate chart data with filters
export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('🌐 [API /charts/data] Request:', JSON.stringify(body, null, 2));

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
      console.error('❌ [API /charts/data] Chart not found:', body.chart_id);
      return NextResponse.json(
        { error: 'Chart not found' },
        { status: 404 }
      );
    }
    console.log('✓ [API /charts/data] Chart found:', chart.name);

    // Get view filters
    const viewFilters: SavedFilter[] = [];
    if (body.view_filter_ids && Array.isArray(body.view_filter_ids)) {
      console.log('🔍 [API /charts/data] Fetching view filters:', body.view_filter_ids);
      for (const filterId of body.view_filter_ids) {
        const filter = await getFilterById(filterId);
        if (filter) {
          console.log('  ✓ Loaded filter:', filterId, filter.name, JSON.stringify(filter.filterData));
          viewFilters.push(filter as SavedFilter);
        } else {
          console.warn('  ⚠️ Filter not found:', filterId);
        }
      }
    }

    // Get chart-specific filter
    let chartFilter: SavedFilter | undefined;
    if (body.chart_filter_id) {
      console.log('🔍 [API /charts/data] Fetching chart filter:', body.chart_filter_id);
      const filter = await getFilterById(body.chart_filter_id);
      if (filter) {
        console.log('  ✓ Loaded chart filter:', filter.name, JSON.stringify(filter.filterData));
        chartFilter = filter as SavedFilter;
      } else {
        console.warn('  ⚠️ Chart filter not found:', body.chart_filter_id);
      }
    }

    console.log('📊 [API /charts/data] Total view filters loaded:', viewFilters.length);
    console.log('📊 [API /charts/data] Chart filter loaded:', chartFilter ? 'Yes' : 'No');

    // Calculate chart data
    const data = await calculateChartData(
      {
        ...chart,
        chart_type: chart.chartType as any,
        x_axis: chart.xAxis,
        y_axis: chart.yAxis,
        group_by: chart.groupBy,
        time_group: chart.timeGroup as any,
        k_clusters: chart.kClusters,
        label_field: chart.labelField,
        text_mode: chart.textMode as any,
        cumulative: chart.cumulative,
        created_at: chart.createdAt.toISOString(),
        updated_at: chart.updatedAt.toISOString(),
      },
      viewFilters,
      chartFilter
    );

    console.log('✅ [API /charts/data] Success, returning', data.length, 'data points');

    return NextResponse.json({
      data,
      metadata: {
        total: data.reduce((sum, item) => sum + item.value, 0),
        filters_applied: {
          view_filters: viewFilters.map((f) => ({ id: f.id, name: f.name })),
          chart_filter: chartFilter ? { id: chartFilter.id, name: chartFilter.name } : null,
        },
      },
    });
  } catch (error) {
    console.error('❌ [API /charts/data] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to calculate chart data' },
      { status: 500 }
    );
  }
}
