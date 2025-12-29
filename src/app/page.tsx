import { getAllMeetingsWithAnalysis, getMeetingsWithFilters, calculateAnalytics } from '@/lib/db/queries';
import { getFilterById } from '@/lib/charts/queries';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import StatsCard from '@/components/dashboard/StatsCard';
import ViewSelector from '@/components/views/ViewSelector';
import FilterDropdown from '@/components/dashboard/FilterDropdown';
import styles from "./page.module.css"

export default async function Home({ searchParams }: { searchParams: { filterId?: string } }) {
  const filterId = searchParams.filterId;

  // Fetch filter if provided
  const filter = filterId ? await getFilterById(filterId) : null;

  // Fetch meetings - either all or filtered
  const meetings = filter
    ? await getMeetingsWithFilters(filter)
    : await getAllMeetingsWithAnalysis();

  // Calculate analytics from meetings
  const analytics = calculateAnalytics(meetings);

  return (
    <div className="container">
      <div className={styles.dashboardHeader}>
        <h1>Dashboard de Métricas</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <FilterDropdown />
          <ViewSelector />
        </div>
      </div>

      {/* Show filter indicator if active */}
      {filter && (
        <div className={styles.selectionBanner}>
          <span>Filtro activo: {filter.name}</span>
          <a href="/" className={styles.clearLink}>Limpiar filtro</a>
        </div>
      )}

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <StatsCard label="Total Reuniones" value={analytics.total} />
        <StatsCard label="Win Rate" value={`${analytics.winRate}%`} />
        <StatsCard
          label="Confianza Promedio"
          value={analytics.avgConfidence > 0 ? analytics.avgConfidence.toFixed(2) : 'N/A'}
        />
      </div>

      {/* Recharts visualizations */}
      <DashboardCharts data={analytics} />
    </div>
  )
}
