import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { savedCharts, savedFilters, savedViews, viewCharts, viewFilters } from '@/lib/db/schema';
import type { NewSavedChart, NewSavedFilter, NewSavedView, NewViewChart, NewViewFilter } from '@/lib/db/schema';

// ============================================================================
// CHARTS QUERIES
// ============================================================================

/**
 * Get all saved charts
 */
export async function getAllCharts() {
  return await db.select().from(savedCharts).orderBy(desc(savedCharts.createdAt));
}

/**
 * Get a chart by ID
 */
export async function getChartById(id: string) {
  const results = await db.select().from(savedCharts).where(eq(savedCharts.id, id));
  return results[0] || null;
}

/**
 * Create a new chart
 */
export async function createChart(chart: NewSavedChart) {
  const results = await db.insert(savedCharts).values(chart).returning();
  return results[0];
}

/**
 * Update a chart
 */
export async function updateChart(id: string, chart: Partial<NewSavedChart>) {
  const results = await db
    .update(savedCharts)
    .set({ ...chart, updatedAt: new Date() })
    .where(eq(savedCharts.id, id))
    .returning();
  return results[0];
}

/**
 * Delete a chart
 */
export async function deleteChart(id: string) {
  await db.delete(savedCharts).where(eq(savedCharts.id, id));
}

// ============================================================================
// FILTERS QUERIES
// ============================================================================

/**
 * Get all saved filters
 */
export async function getAllFilters() {
  return await db.select().from(savedFilters).orderBy(desc(savedFilters.createdAt));
}

/**
 * Get a filter by ID
 */
export async function getFilterById(id: string) {
  const results = await db.select().from(savedFilters).where(eq(savedFilters.id, id));
  return results[0] || null;
}

/**
 * Create a new filter
 */
export async function createFilter(filter: NewSavedFilter) {
  const results = await db.insert(savedFilters).values(filter).returning();
  return results[0];
}

/**
 * Update a filter
 */
export async function updateFilter(id: string, filter: Partial<NewSavedFilter>) {
  const results = await db
    .update(savedFilters)
    .set({ ...filter, updatedAt: new Date() })
    .where(eq(savedFilters.id, id))
    .returning();
  return results[0];
}

/**
 * Delete a filter
 */
export async function deleteFilter(id: string) {
  await db.delete(savedFilters).where(eq(savedFilters.id, id));
}

// ============================================================================
// VIEWS QUERIES
// ============================================================================

/**
 * Get all saved views
 */
export async function getAllViews() {
  return await db.select().from(savedViews).orderBy(desc(savedViews.createdAt));
}

/**
 * Get a view by ID
 */
export async function getViewById(id: string) {
  const results = await db.select().from(savedViews).where(eq(savedViews.id, id));
  return results[0] || null;
}

/**
 * Get a view with all its charts and filters
 */
export async function getViewWithDetails(viewId: string) {
  // Get the view
  const view = await getViewById(viewId);
  if (!view) return null;

  // Get all charts for this view
  const chartsData = await db
    .select({
      chart: savedCharts,
      viewChart: viewCharts,
    })
    .from(viewCharts)
    .innerJoin(savedCharts, eq(viewCharts.chartId, savedCharts.id))
    .where(eq(viewCharts.viewId, viewId));

  // Get chart-specific filters
  const chartsWithFilters = await Promise.all(
    chartsData.map(async ({ chart, viewChart }) => {
      let chartFilter = null;
      if (viewChart.chartFilterId) {
        chartFilter = await getFilterById(viewChart.chartFilterId);
      }
      return {
        ...chart,
        position: viewChart.position,
        width: viewChart.width,
        chart_filter: chartFilter,
      };
    })
  );

  // Get all filters for this view
  const filtersData = await db
    .select({
      filter: savedFilters,
    })
    .from(viewFilters)
    .innerJoin(savedFilters, eq(viewFilters.filterId, savedFilters.id))
    .where(eq(viewFilters.viewId, viewId));

  return {
    ...view,
    charts: chartsWithFilters.sort((a, b) => a.position - b.position),
    filters: filtersData.map((f) => f.filter),
  };
}

/**
 * Create a new view
 */
export async function createView(view: NewSavedView) {
  const results = await db.insert(savedViews).values(view).returning();
  return results[0];
}

/**
 * Update a view
 */
export async function updateView(id: string, view: Partial<NewSavedView>) {
  const results = await db
    .update(savedViews)
    .set({ ...view, updatedAt: new Date() })
    .where(eq(savedViews.id, id))
    .returning();
  return results[0];
}

/**
 * Delete a view
 */
export async function deleteView(id: string) {
  await db.delete(savedViews).where(eq(savedViews.id, id));
}

// ============================================================================
// VIEW-CHART RELATIONSHIP QUERIES
// ============================================================================

/**
 * Add a chart to a view
 */
export async function addChartToView(data: NewViewChart) {
  const results = await db.insert(viewCharts).values(data).returning();
  return results[0];
}

/**
 * Remove a chart from a view
 */
export async function removeChartFromView(viewId: string, chartId: string) {
  await db
    .delete(viewCharts)
    .where(eq(viewCharts.viewId, viewId))
    .where(eq(viewCharts.chartId, chartId));
}

// ============================================================================
// VIEW-FILTER RELATIONSHIP QUERIES
// ============================================================================

/**
 * Add a filter to a view
 */
export async function addFilterToView(data: NewViewFilter) {
  const results = await db.insert(viewFilters).values(data).returning();
  return results[0];
}

/**
 * Remove a filter from a view
 */
export async function removeFilterFromView(viewId: string, filterId: string) {
  await db
    .delete(viewFilters)
    .where(eq(viewFilters.viewId, viewId))
    .where(eq(viewFilters.filterId, filterId));
}
