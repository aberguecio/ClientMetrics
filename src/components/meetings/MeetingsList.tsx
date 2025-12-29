'use client';

import { useState } from 'react';
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRequeuing, setIsRequeuing] = useState(false);

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    router.push(`/meetings?${params.toString()}`);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedIds(prev =>
      prev.length === meetings.length
        ? []
        : meetings.map(m => m.id)
    );
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedIds.length} reuniones? Esta acción no se puede deshacer.`)) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/meetings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setSelectedIds([]);
        router.refresh();
      } else {
        alert('Error al eliminar las reuniones');
      }
    } catch (error) {
      console.error('Error deleting meetings:', error);
      alert('Error al eliminar las reuniones');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRequeue = async () => {
    if (!confirm(`¿Reencolar ${selectedIds.length} reuniones para análisis de IA?`)) return;

    setIsRequeuing(true);
    try {
      const response = await fetch('/api/meetings/requeue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setSelectedIds([]);
        router.refresh();
        alert('Reuniones reencoladas exitosamente');
      } else {
        alert('Error al reencolar las reuniones');
      }
    } catch (error) {
      console.error('Error requeuing meetings:', error);
      alert('Error al reencolar las reuniones');
    } finally {
      setIsRequeuing(false);
    }
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
      {/* Barra flotante de acciones */}
      {selectedIds.length > 0 && (
        <div className={styles.actionBar}>
          <span className={styles.selectionCount}>
            {selectedIds.length} seleccionada{selectedIds.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleRequeue}
            disabled={isRequeuing}
            className={styles.actionButton}
          >
            {isRequeuing ? 'Reencolando...' : 'Reencolar para IA'}
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className={`${styles.actionButton} ${styles.deleteButton}`}
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCell}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === meetings.length && meetings.length > 0}
                  onChange={toggleAll}
                  className={styles.checkbox}
                />
              </th>
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
                <td className={styles.checkboxCell}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(meeting.id)}
                    onChange={() => toggleSelection(meeting.id)}
                    className={styles.checkbox}
                  />
                </td>
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
