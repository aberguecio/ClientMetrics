'use client';

import ViewSelector from '@/components/views/ViewSelector';
import ViewFilterDropdown from './ViewFilterDropdown';
import type { SavedView, SavedFilter } from '@/types/charts';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  views: SavedView[];
  activeViewId: string | null;
  onViewChange: (viewId: string) => void;
  allFilters: SavedFilter[];
  activeFilterIds: string[];
  onFilterToggle: (filterId: string) => void;
}

export default function DashboardHeader({
  views,
  activeViewId,
  onViewChange,
  allFilters,
  activeFilterIds,
  onFilterToggle,
}: DashboardHeaderProps) {
  return (
    <div className={styles.dashboardHeader}>
      <h1>Dashboard de Métricas</h1>
      <div className={styles.controls}>
        <ViewSelector
          views={views}
          activeViewId={activeViewId}
          onChange={onViewChange}
          inPlaceMode={true}
        />
        <ViewFilterDropdown
          allFilters={allFilters}
          activeFilterIds={activeFilterIds}
          onFilterToggle={onFilterToggle}
        />
      </div>
    </div>
  );
}
