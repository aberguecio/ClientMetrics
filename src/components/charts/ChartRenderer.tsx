'use client';

import { PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SavedChart, ChartData } from '@/types/charts';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ChartRendererProps {
  chart: SavedChart;
  data: ChartData[];
}

// Helper function to get human-readable field labels
function getFieldLabel(field: string): string {
  const labels: Record<string, string> = {
    // Base fields
    'salesRep': 'Representante de Ventas',
    'sales_rep': 'Representante de Ventas',
    'closed': 'Estado',
    'meetingDate': 'Fecha de Reunión',
    'meeting_date': 'Fecha de Reunión',

    // LLM Analysis fields
    'sector': 'Sector',
    'company_size': 'Tamaño de Empresa',
    'discovery_channel': 'Canal de Descubrimiento',
    'interaction_volume_daily': 'Volumen de Interacción Diaria',

    // Metrics
    'count': 'Cantidad',
  };
  return labels[field] || field;
}

// Helper function to get aggregation labels in Spanish
function getAggregationLabel(agg: string): string {
  const labels: Record<string, string> = {
    'count': 'Cantidad',
    'sum': 'Suma',
    'avg': 'Promedio',
    'min': 'Mínimo',
    'max': 'Máximo',
  };
  return labels[agg] || agg;
}

export default function ChartRenderer({ chart, data }: ChartRendererProps) {
  // Parse colors from comma-separated string
  const colors = chart.colors ? chart.colors.split(',').map(c => c.trim()) : DEFAULT_COLORS;

  // Detect if we have multiple series (keys beyond 'label' and 'value')
  const seriesKeys: string[] = [];
  if (data.length > 0) {
    const samplePoint = data[0];
    for (const key in samplePoint) {
      if (key !== 'label' && key !== 'value') {
        seriesKeys.push(key);
      }
    }
  }
  const hasMultipleSeries = seriesKeys.length > 0;

  // Render based on chart type
  switch (chart.chart_type) {
    case 'pie':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.label}: ${entry.value}`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <XAxis
              dataKey="label"
              label={{ value: getFieldLabel(chart.x_axis), position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{
                value: `${getFieldLabel(chart.y_axis)} (${getAggregationLabel(chart.aggregation)})`,
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip />
            <Legend />
            {hasMultipleSeries ? (
              // Multiple series: render a Bar for each series
              seriesKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  fill={colors[index % colors.length]}
                  name={getFieldLabel(key)}
                />
              ))
            ) : (
              // Single series: render single Bar
              <Bar dataKey="value" fill={colors[0]} name={getFieldLabel(chart.y_axis)} />
            )}
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis
              dataKey="label"
              label={{ value: getFieldLabel(chart.x_axis), position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{
                value: `${getFieldLabel(chart.y_axis)} (${getAggregationLabel(chart.aggregation)})`,
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip />
            <Legend />
            {hasMultipleSeries ? (
              // Multiple series: render a Line for each series
              seriesKeys.map((key, index) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  name={getFieldLabel(key)}
                />
              ))
            ) : (
              // Single series: render single Line
              <Line type="monotone" dataKey="value" stroke={colors[0]} name={getFieldLabel(chart.y_axis)} />
            )}
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <XAxis
              dataKey="label"
              label={{ value: getFieldLabel(chart.x_axis), position: 'insideBottom', offset: -5 }}
            />
            <YAxis
              label={{
                value: `${getFieldLabel(chart.y_axis)} (${getAggregationLabel(chart.aggregation)})`,
                angle: -90,
                position: 'insideLeft'
              }}
            />
            <Tooltip />
            <Legend />
            {hasMultipleSeries ? (
              // Multiple series: render an Area for each series
              seriesKeys.map((key, index) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  fill={colors[index % colors.length]}
                  name={getFieldLabel(key)}
                />
              ))
            ) : (
              // Single series: render single Area
              <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} name={getFieldLabel(chart.y_axis)} />
            )}
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return <div>Unsupported chart type: {chart.chart_type}</div>;
  }
}
