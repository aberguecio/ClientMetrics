'use client';

import { PieChart, Pie, BarChart, Bar, LineChart, Line, AreaChart, Area, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { SavedChart, ChartData } from '@/types/charts';

const DEFAULT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface ChartRendererProps {
  chart: SavedChart;
  data: ChartData[];
}

export default function ChartRenderer({ chart, data }: ChartRendererProps) {
  // Parse colors from comma-separated string
  const colors = chart.colors ? chart.colors.split(',').map(c => c.trim()) : DEFAULT_COLORS;

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
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill={colors[0]} name={chart.name} />
          </BarChart>
        </ResponsiveContainer>
      );

    case 'line':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="value" stroke={colors[0]} name={chart.name} />
          </LineChart>
        </ResponsiveContainer>
      );

    case 'area':
      return (
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <XAxis dataKey="label" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area type="monotone" dataKey="value" stroke={colors[0]} fill={colors[0]} name={chart.name} />
          </AreaChart>
        </ResponsiveContainer>
      );

    default:
      return <div>Unsupported chart type: {chart.chart_type}</div>;
  }
}
