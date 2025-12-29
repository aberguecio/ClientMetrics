import { NextResponse } from 'next/server';
import { getAllViews, createView, addChartToView, addFilterToView } from '@/lib/charts/queries';
import { mapViewToApi } from '@/lib/charts/mappers';

// GET /api/views - List all views
export async function GET() {
  try {
    const views = await getAllViews();
    const mappedViews = views.map(mapViewToApi);
    return NextResponse.json(mappedViews);
  } catch (error) {
    console.error('Error fetching views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

// POST /api/views - Create a new view
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      );
    }

    // Create the view
    const newView = await createView({
      name: body.name,
      objective: body.objective || null,
      isDefault: body.is_default || false,
    });

    // Add charts to the view if provided
    if (body.chart_ids && Array.isArray(body.chart_ids)) {
      for (let i = 0; i < body.chart_ids.length; i++) {
        await addChartToView({
          viewId: newView.id,
          chartId: body.chart_ids[i],
          position: i,
          width: 'full', // Default width
          chartFilterId: null,
        });
      }
    }

    // Add filters to the view if provided
    if (body.filter_ids && Array.isArray(body.filter_ids)) {
      for (const filterId of body.filter_ids) {
        await addFilterToView({
          viewId: newView.id,
          filterId,
        });
      }
    }

    return NextResponse.json(mapViewToApi(newView), { status: 201 });
  } catch (error) {
    console.error('Error creating view:', error);
    return NextResponse.json(
      { error: 'Failed to create view' },
      { status: 500 }
    );
  }
}
