'use client';

import { useState, useEffect } from 'react';
import VariableSelector from './VariableSelector';
import ChartPreview from './ChartPreview';
import type { ChartType, AggregationType, SavedChart, SavedFilter } from '@/types/charts';
import styles from './ChartBuilderModal.module.css';
import { validateChartConfig, type ValidationResult } from '@/lib/charts/validation';
import { getChartConfig, AxisRole, getAllowedAggregations } from '@/lib/charts/chart-config';
import { FieldCategory } from '@/lib/charts/field-metadata';

interface ChartBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: ((chart: SavedChart) => void) | (() => void);
  editChart?: SavedChart;
  currentViewId?: string | null;
  autoAddToView?: boolean;
}

// Field configuration derived from chart-config
interface FieldUIConfig {
  role: AxisRole;
  label: string;
  helpText: string;
  required: boolean;
  allowedCategories: FieldCategory[];
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
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

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

  // Real-time validation (run on steps 2 and 3)
  useEffect(() => {
    if (step === 2 || step === 3) {
      const result = validateChartConfig({
        name: step === 2 ? 'temp' : name, // Skip name validation on step 2
        chart_type: chartType,
        x_axis: xAxis,
        y_axis: yAxis,
        group_by: groupBy,
        aggregation,
      });
      setValidationResult(result);
    }
  }, [name, chartType, xAxis, yAxis, groupBy, aggregation, step]);

  if (!isOpen) return null;

  async function handleSave() {
    // Use centralized validation
    const result = validateChartConfig({
      name,
      chart_type: chartType,
      x_axis: xAxis,
      y_axis: yAxis,
      group_by: groupBy,
      aggregation,
    });

    if (!result.valid) {
      const messages = [
        ...result.errors.map(e => `❌ ${e.message}`),
        ...result.warnings.map(w => `⚠️ ${w.message}`),
      ];
      alert('Validación falló:\n\n' + messages.join('\n'));
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
      } else if (chartType === 'vector_cluster') {
        payload.x_axis = xAxis || 'embedding';
        payload.k_clusters = parseInt(groupBy) || 3; // Store K in k_clusters
        payload.label_field = yAxis; // Store label field in label_field
        payload.y_axis = yAxis; // Set y_axis to label field to pass validation (expects Categorical/Text)
        payload.aggregation = 'count'; // Default
        payload.group_by = '';
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
          const viewResponse = await fetch(`/api/views/${currentViewId}`);
          if (viewResponse.ok) {
            const viewData = await viewResponse.json();
            const maxPosition = viewData.charts?.length > 0
              ? Math.max(...viewData.charts.map((c: any) => c.position || 0))
              : -1;

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
              {(['pie', 'bar', 'line', 'area', 'wordcloud', 'vector_cluster'] as ChartType[]).map((type) => (
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
                    {type === 'vector_cluster' && '🔮'}
                  </div>
                  <div className={styles.chartTypeName}>
                    {type === 'vector_cluster' ? 'Vector Cluster' : type.charAt(0).toUpperCase() + type.slice(1) + ' Chart'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        if (chartType === 'vector_cluster') {
          return (
            <div>
              <h3 className={styles.stepTitle}>Step 2 of 3: Configure Clustering</h3>
              <div className={styles.formGrid}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Variable Vectorial *
                  </label>
                  <select
                    value={xAxis} // Reuse xAxis to store the vector field
                    onChange={(e) => setXAxis(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="embedding">Embedding (Default)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Cantidad de Grupos (K) *
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="10"
                    value={groupBy || 3} // Reuse groupBy to store K (as string)
                    onChange={(e) => setGroupBy(e.target.value)}
                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                    Valor a Mostrar (Label) *
                  </label>
                  <VariableSelector
                    label=""
                    value={yAxis} // Reuse yAxis to store label field
                    onChange={(value) => setYAxis(value)}
                    allowedCategories={[FieldCategory.CATEGORICAL, FieldCategory.FREE_TEXT]}
                    required={true}
                  />
                </div>
              </div>
            </div>
          );
        }
        const chartConfig = getChartConfig(chartType);
        return (
          <div>
            <h3 className={styles.stepTitle}>Step 2 of 3: Configure Variables</h3>
            <div className={styles.formGrid}>
              {chartConfig.axisRequirements.map((requirement) => (
                <div key={requirement.role}>
                  <VariableSelector
                    label={requirement.description + (requirement.required ? ' *' : '')}
                    value={
                      requirement.role === AxisRole.X_AXIS || requirement.role === AxisRole.TEXT_FIELD
                        ? xAxis
                        : requirement.role === AxisRole.Y_AXIS
                          ? yAxis
                          : groupBy
                    }
                    onChange={(value) => {
                      if (requirement.role === AxisRole.X_AXIS || requirement.role === AxisRole.TEXT_FIELD) {
                        setXAxis(value);
                      } else if (requirement.role === AxisRole.Y_AXIS) {
                        setYAxis(value);
                      } else {
                        setGroupBy(value);
                      }
                    }}
                    allowedCategories={requirement.allowedCategories}
                    required={requirement.required}
                  />
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {requirement.helpText}
                  </p>
                </div>
              ))}

              {/* Aggregation selector */}
              <div>
                <label htmlFor="aggregation" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                  Agregación *
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
                  {getAllowedAggregations(chartType).map(agg => (
                    <option key={agg} value={agg}>
                      {agg.charAt(0).toUpperCase() + agg.slice(1)}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Cómo calcular el valor (contar, sumar, promediar, etc.)
                </p>
              </div>

              {/* Validation errors and warnings */}
              {validationResult && validationResult.errors.length > 0 && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '0.375rem',
                  gridColumn: '1 / -1',
                }}>
                  <p style={{ fontWeight: 600, color: '#dc2626', marginBottom: '0.5rem' }}>
                    ❌ Errores de validación:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#dc2626' }}>
                    {validationResult.errors.map((error, idx) => (
                      <li key={idx}>
                        {error.message}
                        {error.suggestion && (
                          <span style={{ fontSize: '0.875em', fontStyle: 'italic' }}>
                            {' '}({error.suggestion})
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {validationResult && validationResult.warnings.length > 0 && (
                <div style={{
                  padding: '0.75rem',
                  backgroundColor: '#fef3c7',
                  border: '1px solid #f59e0b',
                  borderRadius: '0.375rem',
                  gridColumn: '1 / -1',
                }}>
                  <p style={{ fontWeight: 600, color: '#d97706', marginBottom: '0.5rem' }}>
                    ⚠️ Advertencias:
                  </p>
                  <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#d97706' }}>
                    {validationResult.warnings.map((warning, idx) => (
                      <li key={idx}>{warning.message}</li>
                    ))}
                  </ul>
                </div>
              )}
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
              <button
                onClick={() => setStep(step + 1)}
                className={styles.primaryButton}
                disabled={step === 2 && validationResult?.valid === false}
                style={{
                  opacity: step === 2 && validationResult?.valid === false ? 0.5 : 1,
                  cursor: step === 2 && validationResult?.valid === false ? 'not-allowed' : 'pointer',
                }}
              >
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
