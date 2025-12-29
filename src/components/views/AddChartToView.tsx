'use client';

import { useState, useEffect } from 'react';
import type { SavedChart } from '@/types/charts';
import styles from './AddChartToView.module.css';

interface AddChartToViewProps {
  viewId: string;
  onChartAdded: () => void;
}

export default function AddChartToView({ viewId, onChartAdded }: AddChartToViewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchCharts();
    }
  }, [isOpen]);

  async function fetchCharts() {
    try {
      setLoading(true);
      const response = await fetch('/api/charts');
      if (response.ok) {
        const data = await response.json();
        setCharts(data);
      }
    } catch (error) {
      console.error('Error fetching charts:', error);
    } finally {
      setLoading(false);
    }
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
        alert('Failed to add chart to view');
      }
    } catch (error) {
      console.error('Error adding chart:', error);
      alert('Error adding chart to view');
    } finally {
      setAdding(false);
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className={styles.addButton}
      >
        + Add Chart to View
      </button>
    );
  }

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Add Chart to View</h2>
          <button onClick={() => setIsOpen(false)} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {loading && <div className={styles.loading}>Loading charts...</div>}

          {!loading && charts.length === 0 && (
            <div className={styles.empty}>
              <p>No charts available.</p>
              <p className={styles.emptyHint}>
                Create charts first on the Charts page.
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
                    {adding ? 'Adding...' : 'Add'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
