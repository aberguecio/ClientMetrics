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

  // 3. Group by field
  const grouped = groupByField(meetings, chart.group_by, chart.time_group);

  // 4. Apply aggregation
  const aggregated = applyAggregation(grouped, chart.aggregation);

  // 5. Format for chart
  return formatForChart(aggregated, chart.x_axis, chart.y_axis);
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
 * @returns Map with aggregated values
 */
export function applyAggregation(
  grouped: Map<string, Array<SalesMeeting & { analysis?: any }>>,
  type: AggregationType
): Map<string, number> {
  const result = new Map<string, number>();

  for (const [key, meetings] of grouped.entries()) {
    let value: number;

    switch (type) {
      case 'count':
        value = meetings.length;
        break;
      case 'sum':
        // For now, just count as we don't have numeric fields to sum
        // This can be extended when we have revenue or other numeric fields
        value = meetings.length;
        break;
      case 'avg': {
        // Calculate average of meetings per group (placeholder)
        value = meetings.length;
        break;
      }
      case 'min':
        value = meetings.length > 0 ? 1 : 0;
        break;
      case 'max':
        value = meetings.length;
        break;
      default:
        value = meetings.length;
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
