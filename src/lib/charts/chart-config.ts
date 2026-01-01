/**
 * Chart Type Configuration
 *
 * Defines compatibility matrix and requirements for each chart type.
 * Determines which field categories can be used for each axis/role.
 */

import type { ChartType, AggregationType } from '@/types/charts';
import { FieldCategory } from './field-metadata';

/**
 * Axis roles define how fields are used in charts
 */
export enum AxisRole {
  X_AXIS = 'x_axis',           // Bar/Line/Area horizontal axis
  Y_AXIS = 'y_axis',           // Metric values (vertical axis)
  GROUP_BY = 'group_by',       // Secondary grouping for multiple series
  CATEGORY = 'category',       // Pie chart slices (uses group_by field)
  TEXT_FIELD = 'text_field',   // Word cloud source text (uses x_axis field)
}

/**
 * Defines requirements for a specific axis/role in a chart
 */
export interface AxisRequirement {
  role: AxisRole;
  required: boolean;
  allowedCategories: FieldCategory[];  // Which field categories can be used
  description: string;                 // Short label for UI
  helpText: string;                    // Detailed explanation for users
}

/**
 * Complete configuration for a chart type
 */
export interface ChartTypeConfig {
  chartType: ChartType;
  label: string;
  icon: string;
  description: string;
  axisRequirements: AxisRequirement[];
  allowedAggregations: AggregationType[];
  defaultAggregation: AggregationType;
  supportsTimeSeries: boolean;
  supportsMultipleSeries: boolean;
}

/**
 * Chart type configuration registry
 *
 * Defines all chart types and their compatibility requirements
 */
export const CHART_TYPE_CONFIGS: Record<ChartType, ChartTypeConfig> = {
  pie: {
    chartType: 'pie',
    label: 'Gráfico de Pastel',
    icon: '🥧',
    description: 'Muestra proporciones de datos categóricos',
    axisRequirements: [
      {
        role: AxisRole.CATEGORY,
        required: true,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.BOOLEAN,
          FieldCategory.CLOSED_ARRAY,  // Triggers frequency calculation mode
        ],
        description: 'Categoría',
        helpText: 'Campo que divide el pastel en sectores. Arrays cerrados mostrarán frecuencia de valores.',
      },
      {
        role: AxisRole.Y_AXIS,
        required: true,
        allowedCategories: [FieldCategory.NUMERIC],
        description: 'Métrica',
        helpText: 'Valor numérico que determina el tamaño de cada sector',
      },
    ],
    allowedAggregations: ['count', 'sum', 'avg'],
    defaultAggregation: 'count',
    supportsTimeSeries: false,
    supportsMultipleSeries: false,
  },

  bar: {
    chartType: 'bar',
    label: 'Gráfico de Barras',
    icon: '📊',
    description: 'Compara valores entre categorías',
    axisRequirements: [
      {
        role: AxisRole.X_AXIS,
        required: true,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.BOOLEAN,
          FieldCategory.TEMPORAL,
          FieldCategory.CLOSED_ARRAY,  // Frequency mode
        ],
        description: 'Categorías (Eje X)',
        helpText: 'Categorías que aparecen como barras en el eje horizontal',
      },
      {
        role: AxisRole.Y_AXIS,
        required: true,
        allowedCategories: [FieldCategory.NUMERIC],
        description: 'Métrica (Eje Y)',
        helpText: 'Valor numérico que determina la altura de las barras',
      },
      {
        role: AxisRole.GROUP_BY,
        required: false,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.BOOLEAN,
        ],
        description: 'Agrupar Por (opcional)',
        helpText: 'Crea múltiples series de barras agrupadas por categoría',
      },
    ],
    allowedAggregations: ['count', 'sum', 'avg', 'min', 'max'],
    defaultAggregation: 'count',
    supportsTimeSeries: true,
    supportsMultipleSeries: true,
  },

  line: {
    chartType: 'line',
    label: 'Gráfico de Líneas',
    icon: '📈',
    description: 'Muestra tendencias a lo largo del tiempo o categorías',
    axisRequirements: [
      {
        role: AxisRole.X_AXIS,
        required: true,
        allowedCategories: [
          FieldCategory.TEMPORAL,      // Preferred for line charts
          FieldCategory.CATEGORICAL,
          FieldCategory.CLOSED_ARRAY,
        ],
        description: 'Eje X (Tiempo/Categoría)',
        helpText: 'Eje horizontal, típicamente fechas para mostrar tendencias temporales',
      },
      {
        role: AxisRole.Y_AXIS,
        required: true,
        allowedCategories: [FieldCategory.NUMERIC],
        description: 'Métrica (Eje Y)',
        helpText: 'Valor numérico del eje vertical',
      },
      {
        role: AxisRole.GROUP_BY,
        required: false,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.BOOLEAN,
        ],
        description: 'Agrupar Por (opcional)',
        helpText: 'Crea múltiples líneas, una por cada categoría',
      },
    ],
    allowedAggregations: ['count', 'sum', 'avg', 'min', 'max'],
    defaultAggregation: 'count',
    supportsTimeSeries: true,
    supportsMultipleSeries: true,
  },

  area: {
    chartType: 'area',
    label: 'Gráfico de Área',
    icon: '📉',
    description: 'Muestra tendencias acumulativas a lo largo del tiempo',
    axisRequirements: [
      {
        role: AxisRole.X_AXIS,
        required: true,
        allowedCategories: [
          FieldCategory.TEMPORAL,
          FieldCategory.CATEGORICAL,
          FieldCategory.CLOSED_ARRAY,
        ],
        description: 'Eje X (Tiempo/Categoría)',
        helpText: 'Eje horizontal, típicamente fechas para mostrar tendencias acumulativas',
      },
      {
        role: AxisRole.Y_AXIS,
        required: true,
        allowedCategories: [FieldCategory.NUMERIC],
        description: 'Métrica (Eje Y)',
        helpText: 'Valor numérico del eje vertical',
      },
      {
        role: AxisRole.GROUP_BY,
        required: false,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.BOOLEAN,
        ],
        description: 'Agrupar Por (opcional)',
        helpText: 'Crea áreas apiladas, una por cada categoría',
      },
    ],
    allowedAggregations: ['count', 'sum', 'avg', 'min', 'max'],
    defaultAggregation: 'count',
    supportsTimeSeries: true,
    supportsMultipleSeries: true,
  },

  wordcloud: {
    chartType: 'wordcloud',
    label: 'Nube de Palabras',
    icon: '☁️',
    description: 'Visualiza frecuencia de palabras en texto',
    axisRequirements: [
      {
        role: AxisRole.TEXT_FIELD,
        required: true,
        allowedCategories: [
          FieldCategory.OPEN_ARRAY,    // pain_points, use_cases, objections
          FieldCategory.FREE_TEXT,      // others
        ],
        description: 'Campo de Texto',
        helpText: 'Campo de texto a analizar para extraer palabras frecuentes',
      },
      {
        role: AxisRole.GROUP_BY,
        required: false,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.BOOLEAN,
        ],
        description: 'Filtrar Por (opcional)',
        helpText: 'Filtrar reuniones por categoría antes de analizar el texto',
      },
    ],
    allowedAggregations: ['count'],  // Only count makes sense for word frequency
    defaultAggregation: 'count',
    supportsTimeSeries: false,
    supportsMultipleSeries: false,
  },

  vector_cluster: {
    chartType: 'vector_cluster',
    label: 'Vector Cluster',
    icon: '🔮',
    description: 'Agrupa reuniones similares usando embeddings',
    axisRequirements: [
      {
        role: AxisRole.X_AXIS, // Used for the vector field
        required: true,
        allowedCategories: [
          FieldCategory.FREE_TEXT, // Embeddings are stored as text
        ],
        description: 'Variable Vectorial',
        helpText: 'Campo que contiene los embeddings (vectores)',
      },
      {
        role: AxisRole.Y_AXIS, // Used for the label field
        required: true,
        allowedCategories: [
          FieldCategory.CATEGORICAL,
          FieldCategory.FREE_TEXT,
        ],
        description: 'Etiqueta',
        helpText: 'Campo a mostrar en el tooltip',
      },
    ],
    allowedAggregations: ['count'],
    defaultAggregation: 'count',
    supportsTimeSeries: false,
    supportsMultipleSeries: false,
  },
};

// ===== HELPER FUNCTIONS =====

/**
 * Get configuration for a specific chart type
 */
export function getChartConfig(chartType: ChartType): ChartTypeConfig {
  return CHART_TYPE_CONFIGS[chartType];
}

/**
 * Get all available chart type configurations
 */
export function getAllChartConfigs(): ChartTypeConfig[] {
  return Object.values(CHART_TYPE_CONFIGS);
}

/**
 * Get axis requirement for a specific role in a chart type
 */
export function getAxisRequirement(
  chartType: ChartType,
  role: AxisRole
): AxisRequirement | null {
  const config = getChartConfig(chartType);
  return config.axisRequirements.find(req => req.role === role) || null;
}

/**
 * Check if a field category is compatible with a specific axis role in a chart type
 */
export function isCategoryCompatibleWithAxis(
  fieldCategory: FieldCategory,
  chartType: ChartType,
  role: AxisRole
): boolean {
  const requirement = getAxisRequirement(chartType, role);
  if (!requirement) return false;
  return requirement.allowedCategories.includes(fieldCategory);
}

/**
 * Check if an aggregation type is allowed for a chart type
 */
export function isAggregationAllowed(
  chartType: ChartType,
  aggregation: AggregationType
): boolean {
  const config = getChartConfig(chartType);
  return config.allowedAggregations.includes(aggregation);
}

/**
 * Get allowed aggregations for a chart type
 */
export function getAllowedAggregations(chartType: ChartType): AggregationType[] {
  return getChartConfig(chartType).allowedAggregations;
}

/**
 * Get default aggregation for a chart type
 */
export function getDefaultAggregation(chartType: ChartType): AggregationType {
  return getChartConfig(chartType).defaultAggregation;
}
