'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useFetchFilters } from '@/lib/hooks';
import styles from './FilterDropdown.module.css';

export default function FilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { filters, loading } = useFetchFilters();
  const currentFilterId = searchParams.get('filterId') || '';

  function handleFilterChange(filterId: string) {
    if (filterId) {
      router.push(`/?filterId=${filterId}`);
    } else {
      router.push('/');
    }
  }

  return (
    <div className={styles.container}>
      <label htmlFor="filter-dropdown" className={styles.label}>
        Filtro:
      </label>
      <select
        id="filter-dropdown"
        value={currentFilterId}
        onChange={(e) => handleFilterChange(e.target.value)}
        disabled={loading}
        className={styles.select}
      >
        <option value="">Sin filtro</option>
        {filters.map((filter) => (
          <option key={filter.id} value={filter.id}>
            {filter.name}
          </option>
        ))}
      </select>
    </div>
  );
}
