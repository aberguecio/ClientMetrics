import MeetingsList from '@/components/meetings/MeetingsList';
import styles from './meetings.module.css';

export default async function MeetingsPage() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  const response = await fetch(`${baseUrl}/api/meetings`, {
    cache: 'no-store',
  });

  let data = { meetings: [], page: 1, limit: 60, total: 0, totalPages: 0 };

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

      <MeetingsList
        meetings={data.meetings}
        page={data.page}
        totalPages={data.totalPages}
      />
    </div>
  );
}
