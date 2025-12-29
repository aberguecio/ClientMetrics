'use client';

import { useEffect, useState } from 'react';
import ChartRenderer from './ChartRenderer';
import type { SavedChart, ChartData, ChartType, AggregationType } from '@/types/charts';

interface ChartPreviewProps {
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  groupBy: string;
  aggregation: AggregationType;
  colors?: string;
}

// Sample data for preview
const SAMPLE_DATA: ChartData[] = [
  { label: 'Technology', value: 45 },
  { label: 'Finance', value: 32 },
  { label: 'Healthcare', value: 28 },
  { label: 'Retail', value: 18 },
  { label: 'Manufacturing', value: 12 },
];

export default function ChartPreview({ chartType, xAxis, yAxis, groupBy, aggregation, colors }: ChartPreviewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading preview...</div>;
  }

  if (!chartType || !xAxis || !yAxis || !groupBy) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Please select chart type and variables to see a preview
      </div>
    );
  }

  const mockChart: SavedChart = {
    id: 'preview',
    name: 'Preview',
    chart_type: chartType,
    x_axis: xAxis,
    y_axis: yAxis,
    group_by: groupBy,
    aggregation: aggregation,
    colors: colors || '#3b82f6,#10b981,#f59e0b,#ef4444,#8b5cf6',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return (
    <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
      <h4 style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
        Chart Preview
      </h4>
      <ChartRenderer chart={mockChart} data={SAMPLE_DATA} />
      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
        Preview with sample data
      </p>
    </div>
  );
}
