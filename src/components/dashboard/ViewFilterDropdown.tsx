'use client';

import { useState, useRef, useEffect } from 'react';
import type { SavedFilter } from '@/types/charts';
import styles from './FilterDropdown.module.css';

interface ViewFilterDropdownProps {
  allFilters: SavedFilter[];
  activeFilterIds: string[];
  onFilterToggle: (filterId: string) => void;
}

export default function ViewFilterDropdown({
  allFilters,
  activeFilterIds,
  onFilterToggle,
}: ViewFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const activeFilters = allFilters.filter(f => activeFilterIds.includes(f.id));

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.dropdownButton}
      >
        <span className={styles.label}>
          Filtros {activeFilters.length > 0 && `(${activeFilters.length})`}
        </span>
        <span className={styles.arrow}>{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {allFilters.length === 0 ? (
            <div className={styles.emptyMessage}>
              No hay filtros disponibles
            </div>
          ) : (
            allFilters.map((filter) => {
              const isActive = activeFilterIds.includes(filter.id);
              return (
                <label
                  key={filter.id}
                  className={styles.filterOption}
                >
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={() => onFilterToggle(filter.id)}
                    className={styles.checkbox}
                  />
                  <span className={styles.filterName}>{filter.name}</span>
                  {filter.description && (
                    <span className={styles.filterDescription}>
                      {filter.description}
                    </span>
                  )}
                </label>
              );
            })
          )}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className={styles.activeBadges}>
          {activeFilters.map((filter) => (
            <span key={filter.id} className={styles.badge}>
              {filter.name}
              <button
                onClick={() => onFilterToggle(filter.id)}
                className={styles.removeBadge}
                aria-label="Remover filtro"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
