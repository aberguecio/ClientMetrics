'use client';

import ChartCard from '@/components/charts/ChartCard';
import type { SavedChart, SavedFilter } from '@/types/charts';
import styles from './ChartsGrid.module.css';

interface ChartsGridProps {
  charts: Array<SavedChart & { chart_filter?: SavedFilter }>;
  activeFilterIds: string[];
  onEdit: (chart: SavedChart) => void;
  onDelete: (chartId: string) => void;
}

export default function ChartsGrid({
  charts,
  activeFilterIds,
  onEdit,
  onDelete,
}: ChartsGridProps) {
  if (charts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No charts in this view yet.</p>
        <p className={styles.hint}>Click "Create Chart" above to add your first chart.</p>
      </div>
    );
  }

  return (
    <div className={styles.chartsGrid}>
      {charts.map(chart => (
        <ChartCard
          key={chart.id}
          chart={chart}
          activeFilterIds={activeFilterIds}
          chartFilterId={chart.chart_filter?.id}
          onEdit={() => onEdit(chart)}
          onDelete={() => onDelete(chart.id)}
        />
      ))}
    </div>
  );
}
