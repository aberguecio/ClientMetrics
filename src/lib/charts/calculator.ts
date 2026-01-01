import { getMeetingsWithFilters } from '@/lib/filters/builder';
import { mergeFilters } from '@/lib/filters/merger';
import type { SavedChart, SavedFilter, ChartData, WordCloudData, AggregationType, TimeGrouping } from '@/types/charts';
import type { SalesMeeting } from '@/lib/db/schema';
import { getFieldMetadata, isFieldClosedArray, isFieldAggregable } from './field-metadata';

/**
 * Calculates chart data based on chart configuration and filters
 *
 * @param chart - Chart configuration
 * @param viewFilters - Array of filters from the view
 * @param chartFilter - Optional chart-specific filter
 * @returns Formatted data ready for Recharts
 */
export async function calculateChartData(
  chart: SavedChart,
  viewFilters: SavedFilter[],
  chartFilter?: SavedFilter
): Promise<ChartData[] | WordCloudData[]> {
  console.log('🎯 [CALCULATOR] Starting calculation for chart:', chart.id);
  console.log('📊 [CALCULATOR] View filters:', viewFilters.length);
  console.log('📊 [CALCULATOR] Chart filter:', chartFilter ? 'Yes' : 'No');

  // 1. Merge all filters (view + chart)
  const mergedFilter = mergeFilters(viewFilters, chartFilter);

  // 2. Fetch meetings with merged filters
  const meetings = await getMeetingsWithFilters(mergedFilter);
  console.log('📊 [CALCULATOR] Meetings fetched:', meetings.length);

  // 3. Handle wordcloud chart type
  if (chart.chart_type === 'wordcloud') {
    return calculateWordCloudData(meetings, chart);
  }

  // 4. Determine grouping field based on chart type
  // For pie charts: use group_by
  // For bar/line/area: use x_axis for primary grouping, group_by for series
  const primaryGroupField = chart.chart_type === 'pie' ? chart.group_by : chart.x_axis;

  // 5. Detect if primary field is a closed array field (using field metadata)
  if (isFieldClosedArray(primaryGroupField)) {
    console.log('📊 [CALCULATOR] Detected closed array field, using frequency calculation');
    // Use frequency calculation for closed array fields
    return calculateClosedArrayFrequency(meetings, {
      ...chart,
      x_axis: primaryGroupField, // Ensure x_axis is set to the field being analyzed
    });
  }

  // 5. Check if we need multiple series (bar/line/area with group_by)
  const needsMultipleSeries = chart.chart_type !== 'pie' && chart.group_by && chart.group_by.trim() !== '';

  if (needsMultipleSeries) {
    // Multiple series: group by both x_axis and group_by
    return calculateMultiSeriesData(meetings, chart);
  } else {
    // Single series: standard grouping
    const grouped = groupByField(meetings, primaryGroupField, chart.time_group);
    const aggregated = applyAggregation(grouped, chart.aggregation, chart.y_axis);
    return formatForChart(aggregated, chart.x_axis, chart.y_axis);
  }
}

/**
 * Calculates chart data for multiple series (when group_by is used)
 *
 * @param meetings - Array of meetings
 * @param chart - Chart configuration
 * @returns Formatted data with multiple series
 */
function calculateMultiSeriesData(
  meetings: Array<SalesMeeting & { analysis?: any }>,
  chart: SavedChart
): ChartData[] {
  // Create a nested map: xAxisValue -> groupByValue -> meetings[]
  const nestedMap = new Map<string, Map<string, Array<SalesMeeting & { analysis?: any }>>>();

  for (const meeting of meetings) {
    // Get x-axis value
    let xValue: string;
    if (chart.x_axis === 'meetingDate' && chart.time_group) {
      xValue = formatDateByGroup(meeting.meetingDate, chart.time_group);
    } else if (chart.x_axis in meeting) {
      xValue = String((meeting as any)[chart.x_axis] ?? 'Unknown');
    } else if (meeting.analysis && chart.x_axis in meeting.analysis) {
      xValue = String(meeting.analysis[chart.x_axis] ?? 'Unknown');
    } else {
      xValue = 'Unknown';
    }

    // Get group_by value
    let groupValue: string;
    if (chart.group_by in meeting) {
      groupValue = String((meeting as any)[chart.group_by] ?? 'Unknown');
    } else if (meeting.analysis && chart.group_by in meeting.analysis) {
      groupValue = String(meeting.analysis[chart.group_by] ?? 'Unknown');
    } else {
      groupValue = 'Unknown';
    }

    // Add to nested map
    if (!nestedMap.has(xValue)) {
      nestedMap.set(xValue, new Map());
    }
    const groupMap = nestedMap.get(xValue)!;
    if (!groupMap.has(groupValue)) {
      groupMap.set(groupValue, []);
    }
    groupMap.get(groupValue)!.push(meeting);
  }

  // Get all unique series (group_by values)
  const allSeries = new Set<string>();
  for (const groupMap of nestedMap.values()) {
    for (const seriesName of groupMap.keys()) {
      allSeries.add(seriesName);
    }
  }

  // Format data for Recharts with multiple series
  const chartData: ChartData[] = [];

  for (const [xValue, groupMap] of nestedMap.entries()) {
    const dataPoint: ChartData = {
      label: xValue,
      value: 0, // Will be sum of all series
    };

    // Add each series value
    for (const seriesName of allSeries) {
      const meetings = groupMap.get(seriesName) || [];
      const value = applyAggregationToMeetings(meetings, chart.aggregation, chart.y_axis);
      dataPoint[seriesName] = value;
      dataPoint.value += value;
    }

    chartData.push(dataPoint);
  }

  // Sort by x-axis value
  chartData.sort((a, b) => a.label.localeCompare(b.label));

  return chartData;
}

/**
 * Helper function to apply aggregation to a meeting array
 */
function applyAggregationToMeetings(
  meetings: Array<SalesMeeting & { analysis?: any }>,
  type: AggregationType,
  field: string = 'count'
): number {
  // If field is 'count', always return count regardless of aggregation type
  if (field === 'count') {
    return meetings.length;
  }

  // Validate field is aggregable for numeric aggregations
  const numericAggregations: AggregationType[] = ['sum', 'avg', 'min', 'max'];
  if (numericAggregations.includes(type) && !isFieldAggregable(field)) {
    console.warn(
      `[Calculator] Field "${field}" is not aggregable (not numeric). ` +
      `Falling back to count. Aggregation "${type}" requires a numeric field.`
    );
    return meetings.length;
  }

  // For other fields, extract numeric values
  const values = meetings
    .map(m => {
      // Check if field exists in analysis
      if (m.analysis && field in m.analysis) {
        const val = m.analysis[field];
        return typeof val === 'number' ? val : 0;
      }
      return 0;
    })
    .filter(v => v !== null && v !== undefined && !isNaN(v));

  switch (type) {
    case 'count':
      return meetings.length;
    case 'sum':
      return values.reduce((sum, val) => sum + val, 0);
    case 'avg':
      return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
    case 'min':
      return values.length > 0 ? Math.min(...values) : 0;
    case 'max':
      return values.length > 0 ? Math.max(...values) : 0;
    default:
      return meetings.length;
  }
}

/**
 * Groups meetings by a specific field, with optional time grouping
 *
 * @param meetings - Array of meetings to group
 * @param field - Field name to group by
 * @param timeGroup - Optional time grouping (day, week, month)
 * @returns Map of grouped meetings
 */
export function groupByField(
  meetings: Array<SalesMeeting & { analysis?: any }>,
  field: string,
  timeGroup?: TimeGrouping
): Map<string, Array<SalesMeeting & { analysis?: any }>> {
  const grouped = new Map<string, Array<SalesMeeting & { analysis?: any }>>();

  for (const meeting of meetings) {
    let key: string;

    // Check if it's a temporal field
    if (field === 'meetingDate' && timeGroup) {
      key = formatDateByGroup(meeting.meetingDate, timeGroup);
    }
    // NEW: Check if it's a nested field (e.g., 'requirements.confidentiality')
    else if (field.includes('.')) {
      const value = getNestedValue(meeting.analysis, field);

      // Handle boolean fields: convert to 'Sí' / 'No'
      if (typeof value === 'boolean') {
        key = value ? 'Sí' : 'No';
      } else {
        key = String(value ?? 'Unknown');
      }
    }
    // Check if it's a field from sales_meetings table
    else if (field in meeting) {
      const value = (meeting as any)[field];

      // Handle boolean fields
      if (typeof value === 'boolean') {
        key = value ? 'Sí' : 'No';
      } else {
        key = String(value ?? 'Unknown');
      }
    }
    // Otherwise, check in analysis JSON (top-level only)
    else if (meeting.analysis && field in meeting.analysis) {
      const value = meeting.analysis[field];

      // Handle boolean fields
      if (typeof value === 'boolean') {
        key = value ? 'Sí' : 'No';
      } else {
        key = String(value ?? 'Unknown');
      }
    }
    // Default to Unknown
    else {
      key = 'Unknown';
    }

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(meeting);
  }

  return grouped;
}

/**
 * Formats a date according to the time grouping
 *
 * @param date - Date to format
 * @param grouping - Time grouping type
 * @returns Formatted date string
 */
function formatDateByGroup(date: Date | string, grouping: TimeGrouping): string {
  const d = typeof date === 'string' ? new Date(date) : date;

  switch (grouping) {
    case 'day':
      return d.toISOString().split('T')[0]; // YYYY-MM-DD
    case 'week': {
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay());
      return `Week of ${weekStart.toISOString().split('T')[0]}`;
    }
    case 'month':
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    case 'quarter': {
      const quarter = Math.floor(d.getMonth() / 3) + 1;
      return `Q${quarter} ${d.getFullYear()}`;
    }
    case 'year':
      return String(d.getFullYear());
    default:
      return d.toISOString().split('T')[0];
  }
}

/**
 * Applies aggregation function to grouped data
 *
 * @param grouped - Map of grouped meetings
 * @param type - Aggregation type
 * @param field - Field to aggregate (y_axis)
 * @returns Map with aggregated values
 */
export function applyAggregation(
  grouped: Map<string, Array<SalesMeeting & { analysis?: any }>>,
  type: AggregationType,
  field: string = 'count'
): Map<string, number> {
  const result = new Map<string, number>();

  for (const [key, meetings] of grouped.entries()) {
    let value: number;

    // If field is 'count', always return count regardless of aggregation type
    if (field === 'count') {
      value = meetings.length;
    } else {
      // For other fields, extract numeric values
      const values = meetings
        .map(m => {
          // Check if field exists in analysis
          if (m.analysis && field in m.analysis) {
            const val = m.analysis[field];
            return typeof val === 'number' ? val : 0;
          }
          return 0;
        })
        .filter(v => v !== null && v !== undefined && !isNaN(v));

      switch (type) {
        case 'count':
          value = meetings.length;
          break;
        case 'sum':
          value = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          value = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          break;
        case 'min':
          value = values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'max':
          value = values.length > 0 ? Math.max(...values) : 0;
          break;
        default:
          value = meetings.length;
      }
    }

    result.set(key, value);
  }

  return result;
}

/**
 * Formats aggregated data for Recharts
 *
 * @param data - Aggregated data map
 * @param xAxis - X-axis field name
 * @param yAxis - Y-axis field name
 * @returns Array of chart data objects
 */
export function formatForChart(
  data: Map<string, number>,
  xAxis: string,
  yAxis: string
): ChartData[] {
  const chartData: ChartData[] = [];

  for (const [label, value] of data.entries()) {
    chartData.push({
      label,
      value,
      [xAxis]: label,
      [yAxis]: value,
    });
  }

  // Sort by value (descending) for better visualization
  chartData.sort((a, b) => b.value - a.value);

  return chartData;
}

/**
 * Get a nested field value from an object using field metadata
 * Uses the path defined in field metadata registry
 */
function getNestedValue(obj: any, fieldKey: string): any {
  const metadata = getFieldMetadata(fieldKey);
  if (!metadata) {
    console.warn(`[Calculator] Unknown field: ${fieldKey}`);
    return undefined;
  }

  return metadata.path.reduce((current, key) => current?.[key], obj);
}

/**
 * Calculates frequency data for closed enum arrays
 * Used for fields like: requirements.integrations, demand_peaks, query_types, tools_mentioned
 *
 * @param meetings - Array of meetings with analysis data
 * @param chart - Chart configuration (x_axis contains the field path)
 * @returns Array of chart data with label (enum value) and value (frequency count)
 */
export function calculateClosedArrayFrequency(
  meetings: Array<SalesMeeting & { analysis?: any }>,
  chart: SavedChart
): ChartData[] {
  const frequencyMap = new Map<string, number>();
  const fieldKey = chart.x_axis; // e.g., 'requirements.integrations', 'demand_peaks'

  // Get field metadata for label mapping
  const fieldMetadata = getFieldMetadata(fieldKey);
  const labelMap = fieldMetadata?.labelMap || {};

  if (!fieldMetadata) {
    console.warn(`[Calculator] Unknown field for frequency calculation: ${fieldKey}`);
    return [];
  }

  for (const meeting of meetings) {
    if (!meeting.analysis) continue;

    // Get the array value using field metadata path
    const arrayValue = getNestedValue(meeting.analysis, fieldKey);

    if (Array.isArray(arrayValue)) {
      for (const item of arrayValue) {
        if (item && typeof item === 'string') {
          frequencyMap.set(item, (frequencyMap.get(item) || 0) + 1);
        }
      }
    }
  }

  // Convert to ChartData format with human-readable labels from field metadata
  const chartData: ChartData[] = Array.from(frequencyMap.entries())
    .map(([key, value]) => ({
      label: labelMap[key] || key, // Use label mapping from metadata or fallback to key
      value,
      raw_key: key, // Keep original for filtering
    }))
    .sort((a, b) => b.value - a.value); // Sort by frequency descending

  return chartData;
}

/**
 * Calculates word cloud data from LLM analysis text fields
 *
 * @param meetings - Array of meetings with analysis data
 * @param chart - Chart configuration (x_axis contains the field name)
 * @returns Array of word cloud data with text and frequency
 */
export function calculateWordCloudData(
  meetings: Array<SalesMeeting & { analysis?: any }>,
  chart: SavedChart
): WordCloudData[] {
  const wordMap = new Map<string, number>();
  const fieldName = chart.x_axis; // 'pain_points', 'use_cases', 'objections', 'others'
  const MIN_FREQUENCY = 2;
  const MIN_WORD_LENGTH = 3; // Ignorar palabras muy cortas

  // Palabras comunes a ignorar (stop words en español)
  const stopWords = new Set([
    'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'ser', 'se', 'no', 'haber',
    'por', 'con', 'su', 'para', 'como', 'estar', 'tener', 'le', 'lo', 'todo',
    'pero', 'más', 'hacer', 'o', 'poder', 'decir', 'este', 'ir', 'otro', 'ese',
    'la', 'si', 'me', 'ya', 'ver', 'porque', 'dar', 'cuando', 'él', 'muy',
    'sin', 'vez', 'mucho', 'saber', 'qué', 'sobre', 'mi', 'alguno', 'mismo',
    'yo', 'también', 'hasta', 'año', 'dos', 'querer', 'entre', 'así', 'primero',
    'desde', 'grande', 'eso', 'ni', 'nos', 'llegar', 'pasar', 'tiempo', 'ella',
    'del', 'los', 'las', 'una', 'es', 'al', 'son', 'the', 'of', 'and', 'to', 'in'
  ]);

  for (const meeting of meetings) {
    if (!meeting.analysis) continue;

    const fieldValue = meeting.analysis[fieldName];
    let allText = '';

    if (Array.isArray(fieldValue)) {
      // For array fields: pain_points, use_cases, objections
      allText = fieldValue.join(' ');
    } else if (typeof fieldValue === 'string' && fieldValue.trim() !== '') {
      // For 'others' field
      allText = fieldValue;
    }

    // Split into words and process
    if (allText) {
      const words = allText
        .toLowerCase()
        .replace(/[^\w\sáéíóúñü]/g, ' ') // Remove punctuation but keep Spanish chars
        .split(/\s+/)
        .filter(word =>
          word.length >= MIN_WORD_LENGTH &&
          !stopWords.has(word) &&
          !/^\d+$/.test(word) // Exclude pure numbers
        );

      for (const word of words) {
        wordMap.set(word, (wordMap.get(word) || 0) + 1);
      }
    }
  }

  // Filter by minimum frequency, sort by frequency, and limit to top 50
  return Array.from(wordMap.entries())
    .filter(([_, count]) => count >= MIN_FREQUENCY)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 50);
}
