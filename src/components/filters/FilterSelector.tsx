'use client';

import { useEffect, useState } from 'react';
import type { SavedFilter } from '@/types/charts';
import styles from './FilterSelector.module.css';

interface FilterSelectorProps {
  selectedFilterIds: string[];
  onSelect: (filterId: string) => void;
  onDeselect: (filterId: string) => void;
}

export default function FilterSelector({ selectedFilterIds, onSelect, onDeselect }: FilterSelectorProps) {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className={styles.loading}>Loading filters...</div>;
  }

  if (filters.length === 0) {
    return (
      <div className={styles.empty}>
        No saved filters yet. Create one to get started!
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Available Filters</h4>
      <div className={styles.filterList}>
        {filters.map((filter) => {
          const isSelected = selectedFilterIds.includes(filter.id);
          return (
            <div
              key={filter.id}
              className={`${styles.filterItem} ${isSelected ? styles.selected : ''}`}
              onClick={() => isSelected ? onDeselect(filter.id) : onSelect(filter.id)}
            >
              <div className={styles.checkbox}>
                {isSelected && '✓'}
              </div>
              <div className={styles.filterInfo}>
                <div className={styles.filterName}>{filter.name}</div>
                {filter.description && (
                  <div className={styles.filterDescription}>{filter.description}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
