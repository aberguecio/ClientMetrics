'use client';

import type { SavedFilter } from '@/types/charts';
import styles from './FilterChip.module.css';

interface FilterChipProps {
  filter: SavedFilter;
  onRemove?: () => void;
}

export default function FilterChip({ filter, onRemove }: FilterChipProps) {
  // Build a readable summary of active filter fields
  const activeFields: string[] = [];
  const data = filter.filter_data;

  if (data.sales_rep) activeFields.push(`Sales Rep: ${data.sales_rep}`);
  if (data.closed !== undefined && data.closed !== null) {
    activeFields.push(`Closed: ${data.closed ? 'Yes' : 'No'}`);
  }
  if (data.sector) activeFields.push(`Sector: ${data.sector}`);
  if (data.date_from || data.date_to) {
    const dateRange = `${data.date_from || '...'} to ${data.date_to || '...'}`;
    activeFields.push(`Date: ${dateRange}`);
  }

  return (
    <div className={styles.chip}>
      <div className={styles.content}>
        <div className={styles.name}>{filter.name}</div>
        {activeFields.length > 0 && (
          <div className={styles.details}>{activeFields.join(' | ')}</div>
        )}
      </div>
      {onRemove && (
        <button onClick={onRemove} className={styles.removeButton} title="Remove filter">
          ✕
        </button>
      )}
    </div>
  );
}
