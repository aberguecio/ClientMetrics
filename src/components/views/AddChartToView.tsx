'use client';

import { useState } from 'react';
import { Modal, LoadingState } from '@/components/common';
import { useFetchCharts } from '@/lib/hooks';
import styles from './AddChartToView.module.css';

interface AddChartToViewProps {
  viewId: string;
  onChartAdded: () => void;
}

export default function AddChartToView({ viewId, onChartAdded }: AddChartToViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { charts, loading, refetch } = useFetchCharts(false);
  const [adding, setAdding] = useState(false);

  function handleOpen() {
    setIsOpen(true);
    refetch();
  }

  async function handleAddChart(chartId: string) {
    try {
      setAdding(true);
      const response = await fetch(`/api/views/${viewId}/charts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chart_id: chartId,
          position: 0,
          width: 'full',
        }),
      });

      if (response.ok) {
        setIsOpen(false);
        onChartAdded();
      } else {
        alert('Falló al agregar el gráfico a la vista');
      }
    } catch (error) {
      console.error('Error adding chart:', error);
      alert('Error al agregar el gráfico a la vista');
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <button onClick={handleOpen} className={styles.addButton}>
        + Agregar gráfico a la vista
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Agregar gráfico a la vista"
        maxWidth="600px"
      >
        {loading && <LoadingState message="Cargando gráficos..." />}

        {!loading && charts.length === 0 && (
          <div className={styles.empty}>
            <p>No hay gráficos disponibles.</p>
            <p className={styles.emptyHint}>
              Crea primero los gráficos en la página de Gráficos.
            </p>
          </div>
        )}

        {!loading && charts.length > 0 && (
          <div className={styles.chartList}>
            {charts.map((chart) => (
              <div key={chart.id} className={styles.chartItem}>
                <div className={styles.chartInfo}>
                  <div className={styles.chartName}>{chart.name}</div>
                  {chart.description && (
                    <div className={styles.chartDescription}>{chart.description}</div>
                  )}
                  <div className={styles.chartMeta}>
                    {chart.chart_type} · {chart.aggregation} by {chart.group_by}
                  </div>
                </div>
                <button
                  onClick={() => handleAddChart(chart.id)}
                  disabled={adding}
                  className={styles.selectButton}
                >
                  {adding ? 'Agregando...' : 'Agregar'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
