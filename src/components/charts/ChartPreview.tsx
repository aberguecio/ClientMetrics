'use client';

import { useEffect, useState } from 'react';
import ChartRenderer from './ChartRenderer';
import type { SavedChart, ChartData, ChartType, AggregationType } from '@/types/charts';
import { SECTOR_LABELS, COMPANY_SIZE_LABELS, DISCOVERY_CHANNEL_LABELS } from '@/lib/constants/llm-enums';

interface ChartPreviewProps {
  chartType: ChartType;
  xAxis: string;
  yAxis: string;
  groupBy: string;
  aggregation: AggregationType;
  colors?: string;
}

// Generate sample data based on the selected field
function generateSampleData(field: string): ChartData[] {
  switch (field) {
    case 'sector':
      return [
        { label: SECTOR_LABELS.tecnologia_software, value: 12 },
        { label: SECTOR_LABELS.servicios_profesionales, value: 8 },
        { label: SECTOR_LABELS.comercio_retail, value: 5 },
        { label: SECTOR_LABELS.salud_bienestar, value: 3 },
        { label: SECTOR_LABELS.financiero, value: 2 },
      ];

    case 'company_size':
      return [
        { label: COMPANY_SIZE_LABELS.pequeña, value: 15 },
        { label: COMPANY_SIZE_LABELS.mediana, value: 10 },
        { label: COMPANY_SIZE_LABELS.grande, value: 5 },
      ];

    case 'discovery_channel':
      return [
        { label: DISCOVERY_CHANNEL_LABELS.referencia, value: 10 },
        { label: DISCOVERY_CHANNEL_LABELS.busqueda_organica, value: 8 },
        { label: DISCOVERY_CHANNEL_LABELS.eventos_presenciales, value: 6 },
        { label: DISCOVERY_CHANNEL_LABELS.redes_profesionales, value: 4 },
        { label: DISCOVERY_CHANNEL_LABELS.otro, value: 2 },
      ];

    case 'salesRep':
    case 'sales_rep':
      return [
        { label: 'Juan Pérez', value: 12 },
        { label: 'María García', value: 10 },
        { label: 'Carlos López', value: 8 },
        { label: 'Ana Martínez', value: 6 },
        { label: 'Pedro Sánchez', value: 4 },
      ];

    case 'closed':
      return [
        { label: 'Cerradas', value: 18 },
        { label: 'Abiertas', value: 12 },
      ];

    case 'meetingDate':
    case 'meeting_date':
      return [
        { label: '2025-01', value: 8 },
        { label: '2025-02', value: 12 },
        { label: '2025-03', value: 15 },
        { label: '2025-04', value: 10 },
        { label: '2025-05', value: 5 },
      ];

    case 'pain_points':
      return [
        { label: 'costo', value: 25 },
        { label: 'implementación', value: 20 },
        { label: 'integración', value: 18 },
        { label: 'tiempo', value: 15 },
        { label: 'capacitación', value: 12 },
        { label: 'migración', value: 10 },
        { label: 'datos', value: 8 },
        { label: 'personalización', value: 6 },
      ];

    case 'use_cases':
      return [
        { label: 'ventas', value: 28 },
        { label: 'clientes', value: 22 },
        { label: 'gestión', value: 18 },
        { label: 'reportes', value: 16 },
        { label: 'pipeline', value: 14 },
        { label: 'leads', value: 12 },
        { label: 'seguimiento', value: 10 },
        { label: 'campañas', value: 8 },
      ];

    case 'objections':
      return [
        { label: 'precio', value: 20 },
        { label: 'presupuesto', value: 18 },
        { label: 'tiempo', value: 15 },
        { label: 'evaluación', value: 12 },
        { label: 'contrato', value: 10 },
        { label: 'competidor', value: 9 },
        { label: 'aprobación', value: 8 },
        { label: 'seguridad', value: 7 },
      ];

    case 'others':
      return [
        { label: 'enterprise', value: 15 },
        { label: 'demo', value: 12 },
        { label: 'funciones', value: 10 },
        { label: 'documentación', value: 9 },
        { label: 'api', value: 8 },
        { label: 'móvil', value: 6 },
        { label: 'integración', value: 5 },
      ];

    // NEW: Closed array fields (frequency count)
    case 'requirements.personalization':
      return [
        { label: 'Por tipo de cliente', value: 12 },
        { label: 'Por idioma', value: 8 },
        { label: 'Por producto/servicio', value: 6 },
        { label: 'Por ubicación', value: 4 },
      ];

    case 'requirements.integrations':
      return [
        { label: 'CRM', value: 18 },
        { label: 'WhatsApp', value: 15 },
        { label: 'Calendario', value: 10 },
        { label: 'E-commerce', value: 7 },
        { label: 'Redes sociales', value: 5 },
      ];

    case 'demand_peaks':
      return [
        { label: 'Promociones', value: 14 },
        { label: 'Temporada alta', value: 10 },
        { label: 'Fines de semana', value: 8 },
        { label: 'Eventos', value: 5 },
      ];

    case 'query_types':
      return [
        { label: 'Precios', value: 20 },
        { label: 'Disponibilidad', value: 16 },
        { label: 'Envíos', value: 12 },
        { label: 'Soporte técnico', value: 9 },
        { label: 'Devoluciones', value: 6 },
      ];

    case 'tools_mentioned':
      return [
        { label: 'WhatsApp', value: 18 },
        { label: 'Email', value: 15 },
        { label: 'Instagram', value: 10 },
        { label: 'Zendesk', value: 7 },
        { label: 'HubSpot', value: 4 },
      ];

    // NEW: Boolean fields (category)
    case 'requirements.confidentiality':
    case 'requirements.multilingual':
    case 'requirements.real_time':
      return [
        { label: 'Sí', value: 12 },
        { label: 'No', value: 8 },
      ];

    default:
      // Fallback genérico
      return [
        { label: 'Categoría A', value: 12 },
        { label: 'Categoría B', value: 8 },
        { label: 'Categoría C', value: 5 },
        { label: 'Categoría D', value: 3 },
      ];
  }
}

// Generate sample data with multiple series for groupBy
function generateMultiSeriesSampleData(xAxisField: string, groupByField: string): ChartData[] {
  // Get sample categories for x-axis
  const xAxisData = generateSampleData(xAxisField);

  // Determine group values based on groupBy field
  let groupValues: string[] = [];
  switch (groupByField) {
    case 'closed':
      groupValues = ['true', 'false'];
      break;
    case 'sector':
      groupValues = [
        SECTOR_LABELS.tecnologia_software,
        SECTOR_LABELS.servicios_profesionales,
        SECTOR_LABELS.comercio_retail
      ];
      break;
    case 'company_size':
      groupValues = [
        COMPANY_SIZE_LABELS.pequeña,
        COMPANY_SIZE_LABELS.mediana,
        COMPANY_SIZE_LABELS.grande
      ];
      break;
    case 'discovery_channel':
      groupValues = [
        DISCOVERY_CHANNEL_LABELS.referencia,
        DISCOVERY_CHANNEL_LABELS.busqueda_organica
      ];
      break;
    case 'salesRep':
    case 'sales_rep':
      groupValues = ['Juan Pérez', 'María García'];
      break;
    default:
      groupValues = ['Serie A', 'Serie B'];
  }

  // Generate multi-series data
  return xAxisData.slice(0, 4).map((item) => {
    const dataPoint: ChartData = {
      label: item.label,
      value: 0,
    };

    // Add value for each group
    groupValues.forEach((groupValue, index) => {
      const value = Math.floor(Math.random() * 10) + 3;
      dataPoint[groupValue] = value;
      dataPoint.value += value;
    });

    return dataPoint;
  });
}

export default function ChartPreview({ chartType, xAxis, yAxis, groupBy, aggregation, colors }: ChartPreviewProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading preview...</div>;
  }

  // Validate required fields based on chart type
  if (!chartType || !yAxis) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Please select chart type and variables to see a preview
      </div>
    );
  }

  // Chart-type specific validation
  if (chartType === 'pie' && !groupBy) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Please select a category for the pie chart
      </div>
    );
  }

  if (chartType === 'wordcloud' && !xAxis) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Please select a text field for the word cloud
      </div>
    );
  }

  if ((chartType === 'bar' || chartType === 'line' || chartType === 'area') && !xAxis) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Please select X-axis for the chart
      </div>
    );
  }

  // Determine which field to use for generating sample data based on chart type
  const dataField = chartType === 'pie' ? groupBy :
                   chartType === 'wordcloud' ? xAxis : xAxis;

  // If no dataField is selected yet, return early
  if (!dataField) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: '#6b7280' }}>
        Please select all required fields to see a preview
      </div>
    );
  }

  // Generate sample data with groupBy support
  const sampleData = chartType !== 'pie' && groupBy
    ? generateMultiSeriesSampleData(xAxis, groupBy)
    : generateSampleData(dataField);

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
      <ChartRenderer chart={mockChart} data={sampleData} />
      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
        Preview with sample data
      </p>
    </div>
  );
}
