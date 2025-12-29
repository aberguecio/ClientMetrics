import { notFound } from 'next/navigation';
import ViewPageClient from './ViewPageClient';
import type { ViewWithDetails } from '@/types/charts';

async function getView(id: string): Promise<ViewWithDetails | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/views/${id}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error('Error fetching view:', error);
    return null;
  }
}

export default async function ViewPage({ params }: { params: { id: string } }) {
  const view = await getView(params.id);

  if (!view) {
    notFound();
  }

  return <ViewPageClient view={view} />;
}
