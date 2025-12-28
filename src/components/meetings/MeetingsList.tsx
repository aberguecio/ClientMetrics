'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { formatDate } from '@/lib/utils';
import styles from './MeetingsList.module.css';

interface Meeting {
  id: string;
  clientName: string;
  email: string;
  phone: string;
  meetingDate: string;
  salesRep: string;
  closed: boolean;
  transcript: string;
  createdAt: string;
  analysis?: any;
}

interface MeetingsListProps {
  meetings: Meeting[];
  page: number;
  totalPages: number;
}

export default function MeetingsList({ meetings, page, totalPages }: MeetingsListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/meetings?${params.toString()}`);
  };

  if (meetings.length === 0) {
    return (
      <div className={styles.empty}>
        <p>No se encontraron reuniones.</p>
        <Link href="/upload" className={styles.uploadLink}>
          Subir archivo CSV
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Email</th>
              <th>Vendedor</th>
              <th>Fecha</th>
              <th>Estado</th>
              <th>Análisis IA</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) => (
              <tr key={meeting.id}>
                <td className={styles.clientName}>{meeting.clientName}</td>
                <td className={styles.email}>{meeting.email}</td>
                <td>
                  <span className={styles.badge}>{meeting.salesRep}</span>
                </td>
                <td>{formatDate(meeting.meetingDate)}</td>
                <td>
                  <span
                    className={`${styles.statusBadge} ${
                      meeting.closed ? styles.closed : styles.open
                    }`}
                  >
                    {meeting.closed ? 'Cerrada' : 'Abierta'}
                  </span>
                </td>
                <td>
                  {meeting.analysis ? (
                    <span className={styles.analyzed}>✓ Analizado</span>
                  ) : (
                    <span className={styles.pending}>Pendiente</span>
                  )}
                </td>
                <td>
                  <Link
                    href={`/meetings/${meeting.id}`}
                    className={styles.viewLink}
                  >
                    Ver detalle
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className={styles.pageButton}
          >
            ← Anterior
          </button>

          <span className={styles.pageInfo}>
            Página {page} de {totalPages}
          </span>

          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className={styles.pageButton}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
