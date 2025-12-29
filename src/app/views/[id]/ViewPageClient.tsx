'use client';

import { useRouter } from 'next/navigation';
import ChartCard from '@/components/charts/ChartCard';
import FilterChip from '@/components/filters/FilterChip';
import AddChartToView from '@/components/views/AddChartToView';
import type { ViewWithDetails } from '@/types/charts';

interface ViewPageClientProps {
  view: ViewWithDetails;
}

export default function ViewPageClient({ view }: ViewPageClientProps) {
  const router = useRouter();
  const viewFilterIds = view.filters.map((f) => f.id);

  function handleChartAdded() {
    // Refresh the page to show the newly added chart
    router.refresh();
  }

  return (
    <div className="container">
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ marginBottom: '0.5rem' }}>{view.name}</h1>
        {view.objective && (
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.125rem' }}>
            {view.objective}
          </p>
        )}
      </div>

      {view.filters.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.75rem' }}>
            Active Filters:
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
            {view.filters.map((filter) => (
              <FilterChip key={filter.id} filter={filter} />
            ))}
          </div>
        </div>
      )}

      <AddChartToView viewId={view.id} onChartAdded={handleChartAdded} />

      {view.charts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-primary)', borderRadius: '0.5rem' }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
            No charts in this view yet.
          </p>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Click "Add Chart to View" above to add charts from your library.
          </p>
        </div>
      )}

      {view.charts.length > 0 && (
        <div style={{ display: 'grid', gap: '2rem', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
          {view.charts.map((chart) => (
            <ChartCard
              key={chart.id}
              chart={chart}
              viewFilterIds={viewFilterIds}
              chartFilterId={chart.chart_filter?.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
