'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SavedFilter } from '@/types/charts';
import styles from './FilterDropdown.module.css';

export default function FilterDropdown() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const currentFilterId = searchParams.get('filterId') || '';

  useEffect(() => {
    fetchFilters();
  }, []);

  async function fetchFilters() {
    try {
      const response = await fetch('/api/filters');
      if (!response.ok) throw new Error('Failed to fetch filters');
      const data = await response.json();
      setFilters(data);
    } catch (error) {
      console.error('Error fetching filters:', error);
    } finally {
      setLoading(false);
    }
  }

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
