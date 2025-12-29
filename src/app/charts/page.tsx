'use client';

import { useState, useEffect } from 'react';
import ChartCard from '@/components/charts/ChartCard';
import ChartBuilderModal from '@/components/charts/ChartBuilderModal';
import type { SavedChart } from '@/types/charts';
import styles from './page.module.css';

export default function ChartsPage() {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<SavedChart | undefined>(undefined);

  useEffect(() => {
    fetchCharts();
  }, []);

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

  async function handleSaveChart(chart: SavedChart) {
    await fetchCharts();
    setIsModalOpen(false);
    setEditingChart(undefined);
  }

  async function handleDeleteChart(id: string) {
    if (!confirm('Are you sure you want to delete this chart?')) return;

    try {
      const response = await fetch(`/api/charts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchCharts();
      }
    } catch (error) {
      console.error('Error deleting chart:', error);
    }
  }

  function handleEditChart(chart: SavedChart) {
    setEditingChart(chart);
    setIsModalOpen(true);
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading charts...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Charts Library</h1>
          <p className={styles.description}>
            Create and manage custom charts. Add them to views to build your dashboards.
          </p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => {
            setEditingChart(undefined);
            setIsModalOpen(true);
          }}
        >
          + Create New Chart
        </button>
      </div>

      {charts.length === 0 && (
        <div className={styles.empty}>
          <p>No charts created yet.</p>
          <p className={styles.emptyHint}>
            Create your first chart to get started building custom dashboards.
          </p>
        </div>
      )}

      {charts.length > 0 && (
        <div className={styles.grid}>
          {charts.map((chart) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              viewFilterIds={[]}
              onEdit={() => handleEditChart(chart)}
              onDelete={() => handleDeleteChart(chart.id)}
            />
          ))}
        </div>
      )}

      {isModalOpen && (
        <ChartBuilderModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingChart(undefined);
          }}
          onSave={handleSaveChart}
          editChart={editingChart}
        />
      )}
    </div>
  );
}
