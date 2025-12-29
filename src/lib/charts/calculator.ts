import { getMeetingsWithFilters } from '@/lib/filters/builder';
import { mergeFilters } from '@/lib/filters/merger';
import type { SavedChart, SavedFilter, ChartData, AggregationType, TimeGrouping } from '@/types/charts';
import type { SalesMeeting } from '@/lib/db/schema';

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
): Promise<ChartData[]> {
  // 1. Merge all filters (view + chart)
  const mergedFilter = mergeFilters(viewFilters, chartFilter);

  // 2. Fetch meetings with merged filters
  const meetings = await getMeetingsWithFilters(mergedFilter);

  // 3. Determine grouping field based on chart type
  // For pie charts: use group_by
  // For bar/line/area: use x_axis for primary grouping, group_by for series
  const primaryGroupField = chart.chart_type === 'pie' ? chart.group_by : chart.x_axis;

  // 4. Check if we need multiple series (bar/line/area with group_by)
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
    // Check if it's a field from sales_meetings table
    else if (field in meeting) {
      key = String((meeting as any)[field] ?? 'Unknown');
    }
    // Otherwise, check in analysis JSON
    else if (meeting.analysis && field in meeting.analysis) {
      key = String(meeting.analysis[field] ?? 'Unknown');
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
