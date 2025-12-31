'use client';

import { useState, useEffect } from 'react';
import VariableSelector from './VariableSelector';
import ChartPreview from './ChartPreview';
import type { ChartType, AggregationType, SavedChart, SavedFilter } from '@/types/charts';
import styles from './ChartBuilderModal.module.css';

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: ((chart: SavedChart) => void) | (() => void); // Can be callback with chart or just refresh
  editChart?: SavedChart;
  // New props for dashboard integration
  currentViewId?: string | null;
  autoAddToView?: boolean;
}

// Field configuration interface
interface FieldConfig {
  name: 'category' | 'metric' | 'aggregation' | 'groupBy';
  label: string;
  helpText: string;
  showVariableSelector: boolean; // For category and metric fields
}

// Get field configuration based on chart type
function getFieldsForChartType(type: ChartType): FieldConfig[] {
  switch (type) {
    case 'pie':
      return [
        {
          name: 'category',
          label: 'Categoría *',
          helpText: 'El campo que dividirá el pastel en sectores (ej: sector, tools_mentioned)',
          showVariableSelector: true,
        },
        {
          name: 'metric',
          label: 'Métrica *',
          helpText: 'El valor numérico que determina el tamaño de cada sector',
          showVariableSelector: true,
        },
        {
          name: 'aggregation',
          label: 'Agregación *',
          helpText: 'Cómo calcular el valor (contar reuniones, sumar, promediar)',
          showVariableSelector: false,
        },
      ];
    case 'wordcloud':
      return [
        {
          name: 'category',
          label: 'Campo de Texto *',
          helpText: 'Selecciona el campo de texto a analizar (pain points, use cases, etc.)',
          showVariableSelector: true,
        },
        {
          name: 'groupBy',
          label: 'Filtrar Por (opcional)',
          helpText: 'Opcional: filtrar por categoría antes de analizar',
          showVariableSelector: true,
        },
      ];
    case 'bar':
      return [
        {
          name: 'category',
          label: 'Categorías (Eje X) *',
          helpText: 'Las categorías que aparecerán como barras (ej: sector, demand_peaks)',
          showVariableSelector: true,
        },
        {
          name: 'metric',
          label: 'Métrica (Eje Y) *',
          helpText: 'El valor que determina la altura de cada barra',
          showVariableSelector: true,
        },
        {
          name: 'aggregation',
          label: 'Agregación *',
          helpText: 'Cómo calcular la altura (contar, sumar, promediar)',
          showVariableSelector: false,
        },
        {
          name: 'groupBy',
          label: 'Agrupar Por (opcional)',
          helpText: 'Crea múltiples barras por categoría (ej: cerradas vs abiertas)',
          showVariableSelector: true,
        },
      ];
    case 'line':
    case 'area':
      return [
        {
          name: 'category',
          label: 'Eje X (Tiempo/Categoría) *',
          helpText: 'El eje horizontal, típicamente fechas o categorías ordenadas',
          showVariableSelector: true,
        },
        {
          name: 'metric',
          label: 'Métrica (Eje Y) *',
          helpText: 'El valor numérico del eje vertical',
          showVariableSelector: true,
        },
        {
          name: 'aggregation',
          label: 'Agregación *',
          helpText: 'Cómo calcular el valor en cada punto',
          showVariableSelector: false,
        },
        {
          name: 'groupBy',
          label: 'Agrupar Por (opcional)',
          helpText: 'Crea múltiples líneas en el gráfico (ej: una por vendedor)',
          showVariableSelector: true,
        },
      ];
    default:
      return [];
  }
}

export default function ChartBuilderModal({
  isOpen,
  onClose,
  editChart,
  onSave,
  currentViewId,
  autoAddToView = false,
}: ChartBuilderModalProps) {
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

  // Reset form when editChart changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset to edit chart values or defaults
      setName(editChart?.name || '');
      setDescription(editChart?.description || '');
      setChartType(editChart?.chart_type || 'bar');
      setXAxis(editChart?.x_axis || '');
      setYAxis(editChart?.y_axis || 'count');
      setGroupBy(editChart?.group_by || '');
      setAggregation(editChart?.aggregation || 'count');
      setColors(editChart?.colors || '');
      setChartFilterId(editChart?.chart_filter_id || '');
      setStep(1);

      // Fetch filters
      fetch('/api/filters')
        .then((r) => r.json())
        .then((data) => setFilters(data))
        .catch((err) => console.error('Error fetching filters:', err));
    }
  }, [isOpen, editChart]);

  if (!isOpen) return null;

  async function handleSave() {
    // Validate based on chart type
    let isValid = true;
    let errorMessage = '';

    if (!name || !chartType) {
      isValid = false;
      errorMessage = 'Por favor ingresa un nombre y selecciona un tipo de gráfico';
    } else {
      // Specific validation per chart type
      switch (chartType) {
        case 'pie':
          if (!groupBy || !yAxis) {
            isValid = false;
            errorMessage = 'Por favor completa categoría y métrica para gráfico de pastel';
          }
          break;
        case 'wordcloud':
          if (!xAxis) {
            isValid = false;
            errorMessage = 'Por favor selecciona un campo de texto para el word cloud';
          }
          break;
        case 'bar':
        case 'line':
        case 'area':
          if (!xAxis || !yAxis) {
            isValid = false;
            errorMessage = 'Por favor completa los ejes X e Y';
          }
          break;
      }
    }

    if (!isValid) {
      alert(errorMessage);
      return;
    }

    setSaving(true);
    try {
      const method = editChart ? 'PUT' : 'POST';
      const url = editChart ? `/api/charts/${editChart.id}` : '/api/charts';

      // Prepare payload based on chart type
      const payload: any = {
        name,
        description,
        chart_type: chartType,
        y_axis: yAxis,
        aggregation,
        colors,
        chart_filter_id: chartFilterId || null,
      };

      // Add chart-type specific fields
      if (chartType === 'pie') {
        payload.group_by = groupBy;
        payload.x_axis = ''; // Not used for pie charts
      } else if (chartType === 'wordcloud') {
        payload.x_axis = xAxis; // Stores the text field to analyze
        payload.y_axis = 'count';
        payload.aggregation = 'count';
        payload.group_by = groupBy || '';
      } else {
        payload.x_axis = xAxis;
        payload.group_by = groupBy || ''; // Optional for bar/line/area (multiple series)
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to save chart');
      }

      const savedChart = await response.json();

      // Auto-add to view if requested
      if (autoAddToView && currentViewId && !editChart) {
        try {
          // Calculate max position from current view
          const viewResponse = await fetch(`/api/views/${currentViewId}`);
          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            const maxPosition = viewData.charts?.length > 0
              ? Math.max(...viewData.charts.map((c: any) => c.position || 0))
              : -1;

            // Add chart to view
            await fetch(`/api/views/${currentViewId}/charts`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chart_id: savedChart.id,
                position: maxPosition + 1,
                width: 'full',
              }),
            });
          }
        } catch (addError) {
          console.error('Error adding chart to view:', addError);
          // Don't fail the whole operation if auto-add fails
        }
      }

      // Call onSave callback or reload
      if (onSave) {
        onSave(savedChart);
      } else {
        window.location.reload();
      }

      onClose();
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
              {(['pie', 'bar', 'line', 'area', 'wordcloud'] as ChartType[]).map((type) => (
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
                    {type === 'wordcloud' && '☁️'}
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
        const fields = getFieldsForChartType(chartType);
        return (
          <div>
            <h3 className={styles.stepTitle}>Step 2 of 3: Configure Variables</h3>
            <div className={styles.formGrid}>
              {fields.map((field) => (
                <div key={field.name}>
                  {field.showVariableSelector ? (
                    <>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                        {field.label}
                      </label>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {field.helpText}
                      </p>
                      <VariableSelector
                        label=""
                        value={
                          field.name === 'category'
                            ? (chartType === 'pie' ? groupBy : xAxis)
                            : field.name === 'groupBy'
                            ? groupBy
                            : yAxis
                        }
                        onChange={(value) => {
                          if (field.name === 'category') {
                            if (chartType === 'pie') {
                              setGroupBy(value);
                            } else {
                              setXAxis(value);
                            }
                          } else if (field.name === 'groupBy') {
                            setGroupBy(value);
                          } else {
                            setYAxis(value);
                          }
                        }}
                        types={
                          field.name === 'metric'
                            ? ['metric']
                            : chartType === 'wordcloud' && field.name === 'category'
                            ? ['text_analysis']
                            : field.name === 'category' && ['bar', 'line', 'area', 'pie'].includes(chartType)
                            ? ['category', 'closed_array'] // Allow both for X-axis/Category
                            : field.name === 'groupBy'
                            ? ['category'] // Group by only accepts regular categories
                            : ['category']
                        }
                      />
                    </>
                  ) : (
                    <>
                      <label htmlFor="aggregation" style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                        {field.label}
                      </label>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                        {field.helpText}
                      </p>
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
                    </>
                  )}
                </div>
              ))}
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
