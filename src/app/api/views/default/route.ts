import { NextResponse } from 'next/server';
import { getDefaultView } from '@/lib/charts/queries';

export async function GET() {
  try {
    const defaultView = await getDefaultView();

    if (!defaultView) {
      return NextResponse.json(null);
    }

    return NextResponse.json(defaultView);
  } catch (error) {
    console.error('Error fetching default view:', error);
    return NextResponse.json(
      { error: 'Failed to fetch default view' },
      { status: 500 }
    );
  }
}
