'use client';

import ChartCard from '@/components/charts/ChartCard';
import type { SavedChart } from '@/types/charts';
import styles from './ChartsGrid.module.css';

interface ChartsGridProps {
  charts: SavedChart[];
  loading?: boolean;
  activeFilterIds: string[];
  onEditChart: (chart: SavedChart) => void;
  onDeleteChart: (chartId: string) => void;
}

export default function ChartsGrid({
  charts,
  loading,
  activeFilterIds,
  onEditChart,
  onDeleteChart,
}: ChartsGridProps) {
  if (loading) {
    return (
      <div className={styles.emptyState}>
        <p>Cargando gráficos...</p>
      </div>
    );
  }

  if (charts.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>No hay gráficos creados todavía.</p>
        <p className={styles.hint}>Haz clic en "Crear Gráfico" arriba para agregar tu primer gráfico.</p>
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
          chartFilterId={chart.chart_filter_id}
          onEdit={() => onEditChart(chart)}
          onDelete={() => onDeleteChart(chart.id)}
        />
      ))}
    </div>
  );
}
