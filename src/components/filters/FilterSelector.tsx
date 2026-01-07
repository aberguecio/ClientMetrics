'use client';

import { useFetchFilters } from '@/lib/hooks';
import { LoadingState } from '@/components/common';
import styles from './FilterSelector.module.css';

interface FilterSelectorProps {
  selectedFilterIds: string[];
  onSelect: (filterId: string) => void;
  onDeselect: (filterId: string) => void;
}

export default function FilterSelector({ selectedFilterIds, onSelect, onDeselect }: FilterSelectorProps) {
  const { filters, loading } = useFetchFilters();

  if (loading) {
    return <LoadingState message="Cargando filtros..." size="small" />;
  }

  if (filters.length === 0) {
    return (
      <div className={styles.empty}>
        No hay filtros guardados aún. ¡Crea uno para comenzar!
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h4 className={styles.title}>Filtros disponibles</h4>
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
