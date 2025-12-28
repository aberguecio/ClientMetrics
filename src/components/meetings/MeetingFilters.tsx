'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import styles from './MeetingFilters.module.css';

export default function MeetingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (value === 'all' || value === '') {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    // Reset page cuando cambian los filtros
    params.delete('page');
    router.push(`/meetings?${params.toString()}`);
  };

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <label htmlFor="salesRep" className={styles.label}>
          Vendedor:
        </label>
        <select
          id="salesRep"
          className={styles.select}
          value={searchParams.get('salesRep') || 'all'}
          onChange={(e) => handleFilterChange('salesRep', e.target.value)}
        >
          <option value="all">Todos los vendedores</option>
          <option value="Toro">Toro</option>
          <option value="Puma">Puma</option>
          <option value="Leon">Leon</option>
          <option value="Tigre">Tigre</option>
          <option value="Pantera">Pantera</option>
        </select>
      </div>

      <div className={styles.filterGroup}>
        <label htmlFor="closed" className={styles.label}>
          Estado:
        </label>
        <select
          id="closed"
          className={styles.select}
          value={searchParams.get('closed') || 'all'}
          onChange={(e) => handleFilterChange('closed', e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="true">Cerradas</option>
          <option value="false">Abiertas</option>
        </select>
      </div>

      <button
        className={styles.resetButton}
        onClick={() => router.push('/meetings')}
      >
        Limpiar filtros
      </button>
    </div>
  );
}
