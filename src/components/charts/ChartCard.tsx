'use client';

import { useState, useEffect } from 'react';
import ChartRenderer from './ChartRenderer';
import type { SavedChart, ChartData } from '@/types/charts';
import styles from './ChartCard.module.css';

interface ChartCardProps {
  chart: SavedChart;
  activeFilterIds?: string[];
  chartFilterId?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ChartCard({ chart, activeFilterIds, chartFilterId, onEdit, onDelete }: ChartCardProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, [chart.id, activeFilterIds, chartFilterId]);

  async function fetchChartData() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/charts/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart_id: chart.id,
          view_filter_ids: activeFilterIds,
          chart_filter_id: chartFilterId,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló al obtener datos del gráfico');
      }

      const result = await response.json();
      // Unwrap the data from the standardized API response
      const apiData = result.data || result;
      setData(apiData.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>{chart.name}</h3>
          {chart.description && <p className={styles.description}>{chart.description}</p>}
        </div>
        <div className={styles.actions}>
          {onEdit && (
            <button onClick={onEdit} className="btn-icon" title="Editar gráfico">
              ✏️
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="btn-icon" title="Eliminar gráfico">
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className={styles.content}>
        {loading && <div className={styles.loading}>Cargando datos del gráfico...</div>}
        {error && <div className={styles.error}>Error: {error}</div>}
        {!loading && !error && data.length === 0 && (
          <div className={styles.noData}>No hay datos disponibles para este gráfico</div>
        )}
        {!loading && !error && data.length > 0 && (
          <ChartRenderer chart={chart} data={data} />
        )}
      </div>
    </div>
  );
}
