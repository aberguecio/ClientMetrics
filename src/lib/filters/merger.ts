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
  console.log('🔍 [MERGER] Starting merge');
  console.log('📊 [MERGER] View filters count:', viewFilters.length);
  console.log('📊 [MERGER] View filters:', JSON.stringify(viewFilters, null, 2));
  console.log('📊 [MERGER] Chart filter:', JSON.stringify(chartFilter, null, 2));

  const merged: MergedFilter = {};

  // Apply all view filters (AND between them)
  for (const filter of viewFilters) {
    if (!filter || !filter.filterData) {
      console.log('⚠️ [MERGER] Skipping invalid filter:', filter);
      continue;
    }
    const filterData = filter.filterData;
    console.log('🔄 [MERGER] Processing filter:', filter.id, filterData);

    // Copy all non-metadata fields
    if (filterData.sales_rep !== undefined && filterData.sales_rep !== null) {
      console.log('  ✓ Setting sales_rep:', filterData.sales_rep);
      merged.sales_rep = filterData.sales_rep;
    }
    if (filterData.closed !== undefined && filterData.closed !== null) {
      console.log('  ✓ Setting closed:', filterData.closed);
      merged.closed = filterData.closed;
    }
    if (filterData.date_from !== undefined && filterData.date_from !== null) {
      console.log('  ✓ Setting date_from:', filterData.date_from);
      merged.date_from = filterData.date_from;
    }
    if (filterData.date_to !== undefined && filterData.date_to !== null) {
      console.log('  ✓ Setting date_to:', filterData.date_to);
      merged.date_to = filterData.date_to;
    }
    // LLM fields
    if (filterData.sector !== undefined && filterData.sector !== null) {
      console.log('  ✓ Setting sector:', filterData.sector);
      merged.sector = filterData.sector;
    }
    if (filterData.company_size !== undefined && filterData.company_size !== null) {
      console.log('  ✓ Setting company_size:', filterData.company_size);
      merged.company_size = filterData.company_size;
    }
    if (filterData.discovery_channel !== undefined && filterData.discovery_channel !== null) {
      console.log('  ✓ Setting discovery_channel:', filterData.discovery_channel);
      merged.discovery_channel = filterData.discovery_channel;
    }
    if (filterData.pain_points !== undefined && filterData.pain_points !== null) {
      console.log('  ✓ Setting pain_points:', filterData.pain_points);
      merged.pain_points = filterData.pain_points;
    }
    if (filterData.budget_range !== undefined && filterData.budget_range !== null) {
      console.log('  ✓ Setting budget_range:', filterData.budget_range);
      merged.budget_range = filterData.budget_range;
    }
    if (filterData.decision_maker !== undefined && filterData.decision_maker !== null) {
      console.log('  ✓ Setting decision_maker:', filterData.decision_maker);
      merged.decision_maker = filterData.decision_maker;
    }
  }

  // Apply chart filter (AND with view filters)
  // Chart filter values override view filter values if there's a conflict
  if (chartFilter && chartFilter.filterData) {
    console.log('🔄 [MERGER] Processing chart filter:', chartFilter.id);
    const chartFilterData = chartFilter.filterData;

    if (chartFilterData.sales_rep !== undefined && chartFilterData.sales_rep !== null) {
      console.log('  ✓ Overriding sales_rep:', chartFilterData.sales_rep);
      merged.sales_rep = chartFilterData.sales_rep;
    }
    if (chartFilterData.closed !== undefined && chartFilterData.closed !== null) {
      console.log('  ✓ Overriding closed:', chartFilterData.closed);
      merged.closed = chartFilterData.closed;
    }
    if (chartFilterData.date_from !== undefined && chartFilterData.date_from !== null) {
      console.log('  ✓ Overriding date_from:', chartFilterData.date_from);
      merged.date_from = chartFilterData.date_from;
    }
    if (chartFilterData.date_to !== undefined && chartFilterData.date_to !== null) {
      console.log('  ✓ Overriding date_to:', chartFilterData.date_to);
      merged.date_to = chartFilterData.date_to;
    }
    // LLM fields
    if (chartFilterData.sector !== undefined && chartFilterData.sector !== null) {
      console.log('  ✓ Overriding sector:', chartFilterData.sector);
      merged.sector = chartFilterData.sector;
    }
    if (chartFilterData.company_size !== undefined && chartFilterData.company_size !== null) {
      console.log('  ✓ Overriding company_size:', chartFilterData.company_size);
      merged.company_size = chartFilterData.company_size;
    }
    if (chartFilterData.discovery_channel !== undefined && chartFilterData.discovery_channel !== null) {
      console.log('  ✓ Overriding discovery_channel:', chartFilterData.discovery_channel);
      merged.discovery_channel = chartFilterData.discovery_channel;
    }
    if (chartFilterData.pain_points !== undefined && chartFilterData.pain_points !== null) {
      console.log('  ✓ Overriding pain_points:', chartFilterData.pain_points);
      merged.pain_points = chartFilterData.pain_points;
    }
    if (chartFilterData.budget_range !== undefined && chartFilterData.budget_range !== null) {
      console.log('  ✓ Overriding budget_range:', chartFilterData.budget_range);
      merged.budget_range = chartFilterData.budget_range;
    }
    if (chartFilterData.decision_maker !== undefined && chartFilterData.decision_maker !== null) {
      console.log('  ✓ Overriding decision_maker:', chartFilterData.decision_maker);
      merged.decision_maker = chartFilterData.decision_maker;
    }
  }

  console.log('✅ [MERGER] Final merged filter:', JSON.stringify(merged, null, 2));
  return merged;
}
