'use client';

import ActiveFiltersDisplay from './ActiveFiltersDisplay';
import ChartsGrid from './ChartsGrid';
import type { ViewWithDetails, SavedChart } from '@/types/charts';
import styles from './DashboardViewContent.module.css';

interface DashboardViewContentProps {
  view: ViewWithDetails | null;
  onRefresh: () => void;
  onEditChart: (chart: SavedChart) => void;
  onDeleteChart: (chartId: string) => void;
}

export default function DashboardViewContent({
  view,
  onRefresh,
  onEditChart,
  onDeleteChart,
}: DashboardViewContentProps) {
  if (!view) {
    return (
      <div className={styles.emptyViewState}>
        <h2>No View Selected</h2>
        <p>Select a view from the dropdown above or create a new one.</p>
      </div>
    );
  }

  const viewFilterIds = view.filters.map(f => f.id);

  return (
    <div className={styles.dashboardViewContent}>
      <div className={styles.viewHeader}>
        <div>
          <h2>{view.name}</h2>
          {view.objective && (
            <p className={styles.objective}>{view.objective}</p>
          )}
        </div>
      </div>

      <ActiveFiltersDisplay filters={view.filters} />

      <ChartsGrid
        charts={view.charts}
        viewFilterIds={viewFilterIds}
        onEdit={onEditChart}
        onDelete={onDeleteChart}
      />
    </div>
  );
}
