import MeetingDetailView from '@/components/meetings/MeetingDetailView';
import type { MeetingDetail } from '@/types/api';

export default async function MeetingDetailPage({ params }: { params: { id: string } }) {
  const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/meetings/${params.id}`, {
    cache: 'no-store'
  });

  if (!response.ok) {
    return (
      <div className="container">
        <h1>Error</h1>
        <p>No se pudo cargar la reunión</p>
      </div>
    );
  }

  const result = await response.json();
  // Unwrap the data from the standardized API response
  const meeting: MeetingDetail = result.data || result;

  return (
    <div className="container">
      <MeetingDetailView meeting={meeting} />
    </div>
  );
}
