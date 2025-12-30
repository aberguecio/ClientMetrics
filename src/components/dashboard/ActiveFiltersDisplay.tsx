'use client';

import FilterChip from '@/components/filters/FilterChip';
import type { SavedFilter } from '@/types/charts';
import styles from './ActiveFiltersDisplay.module.css';

interface ActiveFiltersDisplayProps {
  filters: SavedFilter[];
}

export default function ActiveFiltersDisplay({ filters }: ActiveFiltersDisplayProps) {
  if (filters.length === 0) {
    return null;
  }

  return (
    <div className={styles.activeFilters}>
      <h3 className={styles.title}>Active Filters:</h3>
      <div className={styles.filterChips}>
        {filters.map(filter => (
          <FilterChip key={filter.id} filter={filter} />
        ))}
      </div>
    </div>
  );
}
