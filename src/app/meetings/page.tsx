import MeetingsList from '@/components/meetings/MeetingsList';
import MeetingFilters from '@/components/meetings/MeetingFilters';
import styles from './meetings.module.css';

interface SearchParams {
  salesRep?: string;
  closed?: string;
  page?: string;
}

export default async function MeetingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  // Construir URL para la API
  const params = new URLSearchParams();
  if (searchParams.salesRep) params.set('salesRep', searchParams.salesRep);
  if (searchParams.closed) params.set('closed', searchParams.closed);
  if (searchParams.page) params.set('page', searchParams.page);

  // Fetch meetings data
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}/api/meetings?${params.toString()}`, {
    cache: 'no-store', // Siempre obtener datos frescos
  });

  let data = { meetings: [], page: 1, limit: 50, total: 0, totalPages: 0 };

  if (response.ok) {
    data = await response.json();
  }

  return (
    <div className="container">
      <div className={styles.header}>
        <h1>Reuniones de Ventas</h1>
        <p className={styles.subtitle}>
          Total de reuniones: <strong>{data.total}</strong>
        </p>
      </div>

      <MeetingFilters />

      <MeetingsList
        meetings={data.meetings}
        page={data.page}
        totalPages={data.totalPages}
      />
    </div>
  );
}
