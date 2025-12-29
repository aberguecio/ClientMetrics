'use client';

import { useState, useEffect } from 'react';
import VariableSelector from './VariableSelector';
import ChartPreview from './ChartPreview';
import type { ChartType, AggregationType, SavedChart, SavedFilter } from '@/types/charts';
import styles from './ChartBuilderModal.module.css';

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (chart: SavedChart) => void;
  editChart?: SavedChart;
}

export default function ChartBuilderModal({ isOpen, onClose, editChart }: ChartBuilderModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(editChart?.name || '');
  const [description, setDescription] = useState(editChart?.description || '');
  const [chartType, setChartType] = useState<ChartType>(editChart?.chart_type || 'bar');
  const [xAxis, setXAxis] = useState(editChart?.x_axis || '');
  const [yAxis, setYAxis] = useState(editChart?.y_axis || 'count');
  const [groupBy, setGroupBy] = useState(editChart?.group_by || '');
  const [aggregation, setAggregation] = useState<AggregationType>(editChart?.aggregation || 'count');
  const [colors, setColors] = useState(editChart?.colors || '');
  const [chartFilterId, setChartFilterId] = useState(editChart?.chart_filter_id || '');
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [saving, setSaving] = useState(false);

  // Fetch filters when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/filters')
        .then((r) => r.json())
        .then((data) => setFilters(data))
        .catch((err) => console.error('Error fetching filters:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!name || !chartType || !xAxis || !yAxis || !groupBy) {
      alert('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const method = editChart ? 'PUT' : 'POST';
      const url = editChart ? `/api/charts/${editChart.id}` : '/api/charts';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          chart_type: chartType,
          x_axis: xAxis,
          y_axis: yAxis,
          group_by: groupBy,
          aggregation,
          colors,
          chart_filter_id: chartFilterId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save chart');
      }

      const savedChart = await response.json();
      window.location.reload(); // Refresh to show new chart
    } catch (error) {
      alert('Error saving chart: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <div>
            <h3 className={styles.stepTitle}>Step 1 of 3: Chart Type</h3>
            <div className={styles.chartTypeGrid}>
              {(['pie', 'bar', 'line', 'area'] as ChartType[]).map((type) => (
                <button
                  key={type}
                  className={`${styles.chartTypeButton} ${chartType === type ? styles.active : ''}`}
                  onClick={() => setChartType(type)}
                >
                  <div className={styles.chartTypeIcon}>
                    {type === 'pie' && '🥧'}
                    {type === 'bar' && '📊'}
                    {type === 'line' && '📈'}
                    {type === 'area' && '📉'}
                  </div>
                  <div className={styles.chartTypeName}>
                    {type.charAt(0).toUpperCase() + type.slice(1)} Chart
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className={styles.stepTitle}>Step 2 of 3: Configure Variables</h3>
            <div className={styles.formGrid}>
              <VariableSelector label="X-Axis" value={xAxis} onChange={setXAxis} />
              <VariableSelector label="Y-Axis (Metric)" value={yAxis} onChange={setYAxis} />
              <VariableSelector label="Group By" value={groupBy} onChange={setGroupBy} />

              <div>
                <label htmlFor="aggregation" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Aggregation
                </label>
                <select
                  id="aggregation"
                  value={aggregation}
                  onChange={(e) => setAggregation(e.target.value as AggregationType)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                  }}
                >
                  <option value="count">Count</option>
                  <option value="sum">Sum</option>
                  <option value="avg">Average</option>
                  <option value="min">Minimum</option>
                  <option value="max">Maximum</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className={styles.stepTitle}>Step 3 of 3: Preview & Save</h3>
            <div className={styles.formGrid}>
              <div>
                <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Chart Name *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Sales by Sector"
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Description (optional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of this chart"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                  }}
                />
              </div>

              <div>
                <label htmlFor="chartFilter" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Chart Filter (optional)
                </label>
                <select
                  id="chartFilter"
                  value={chartFilterId}
                  onChange={(e) => setChartFilterId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                  }}
                >
                  <option value="">Sin filtro</option>
                  {filters.map((filter) => (
                    <option key={filter.id} value={filter.id}>
                      {filter.name}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Este filtro se aplicará solo a este gráfico
                </p>
              </div>
            </div>

            <div style={{ marginTop: '1.5rem' }}>
              <ChartPreview
                chartType={chartType}
                xAxis={xAxis}
                yAxis={yAxis}
                groupBy={groupBy}
                aggregation={aggregation}
                colors={colors}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editChart ? 'Edit Chart' : 'Create New Chart'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {renderStep()}
        </div>

        <div className={styles.footer}>
          <div className={styles.steps}>
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`${styles.stepIndicator} ${step >= s ? styles.activeStep : ''}`}
              />
            ))}
          </div>

          <div className={styles.buttons}>
            {step > 1 && (
              <button onClick={() => setStep(step - 1)} className={styles.secondaryButton}>
                Previous
              </button>
            )}
            {step < 3 && (
              <button onClick={() => setStep(step + 1)} className={styles.primaryButton}>
                Next
              </button>
            )}
            {step === 3 && (
              <button onClick={handleSave} disabled={saving} className={styles.primaryButton}>
                {saving ? 'Saving...' : editChart ? 'Update Chart' : 'Create Chart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
