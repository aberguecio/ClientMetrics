import type { SavedFilter, MergedFilter } from '@/types/charts';

/**
 * Merges multiple view filters and an optional chart filter into a single filter object
 * Filters are combined using AND logic (additive)
 *
 * @param viewFilters - Array of filters from the view
 * @param chartFilter - Optional chart-specific filter
 * @returns Merged filter object with all non-null fields
 */
export function mergeFilters(
  viewFilters: SavedFilter[],
  chartFilter?: SavedFilter
): MergedFilter {
  const merged: MergedFilter = {};

  // Apply all view filters (AND between them)
  for (const filter of viewFilters) {
    // Copy all non-metadata fields
    if (filter.sales_rep !== undefined && filter.sales_rep !== null) {
      merged.sales_rep = filter.sales_rep;
    }
    if (filter.closed !== undefined && filter.closed !== null) {
      merged.closed = filter.closed;
    }
    if (filter.date_from !== undefined && filter.date_from !== null) {
      merged.date_from = filter.date_from;
    }
    if (filter.date_to !== undefined && filter.date_to !== null) {
      merged.date_to = filter.date_to;
    }
    // LLM fields
    if (filter.sector !== undefined && filter.sector !== null) {
      merged.sector = filter.sector;
    }
    if (filter.company_size !== undefined && filter.company_size !== null) {
      merged.company_size = filter.company_size;
    }
    if (filter.discovery_channel !== undefined && filter.discovery_channel !== null) {
      merged.discovery_channel = filter.discovery_channel;
    }
    if (filter.pain_points !== undefined && filter.pain_points !== null) {
      merged.pain_points = filter.pain_points;
    }
    if (filter.budget_range !== undefined && filter.budget_range !== null) {
      merged.budget_range = filter.budget_range;
    }
    if (filter.decision_maker !== undefined && filter.decision_maker !== null) {
      merged.decision_maker = filter.decision_maker;
    }
  }

  // Apply chart filter (AND with view filters)
  // Chart filter values override view filter values if there's a conflict
  if (chartFilter) {
    if (chartFilter.sales_rep !== undefined && chartFilter.sales_rep !== null) {
      merged.sales_rep = chartFilter.sales_rep;
    }
    if (chartFilter.closed !== undefined && chartFilter.closed !== null) {
      merged.closed = chartFilter.closed;
    }
    if (chartFilter.date_from !== undefined && chartFilter.date_from !== null) {
      merged.date_from = chartFilter.date_from;
    }
    if (chartFilter.date_to !== undefined && chartFilter.date_to !== null) {
      merged.date_to = chartFilter.date_to;
    }
    // LLM fields
    if (chartFilter.sector !== undefined && chartFilter.sector !== null) {
      merged.sector = chartFilter.sector;
    }
    if (chartFilter.company_size !== undefined && chartFilter.company_size !== null) {
      merged.company_size = chartFilter.company_size;
    }
    if (chartFilter.discovery_channel !== undefined && chartFilter.discovery_channel !== null) {
      merged.discovery_channel = chartFilter.discovery_channel;
    }
    if (chartFilter.pain_points !== undefined && chartFilter.pain_points !== null) {
      merged.pain_points = chartFilter.pain_points;
    }
    if (chartFilter.budget_range !== undefined && chartFilter.budget_range !== null) {
      merged.budget_range = chartFilter.budget_range;
    }
    if (chartFilter.decision_maker !== undefined && chartFilter.decision_maker !== null) {
      merged.decision_maker = chartFilter.decision_maker;
    }
  }

  return merged;
}
