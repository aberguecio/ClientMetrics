import { getMeetingsByIds, getAllMeetingsWithAnalysis, calculateAnalytics } from '@/lib/db/queries';
import DashboardCharts from '@/components/dashboard/DashboardCharts';
import StatsCard from '@/components/dashboard/StatsCard';
import styles from "./page.module.css"

export default async function Home({ searchParams }: { searchParams: { ids?: string } }) {
  const ids = searchParams.ids?.split(',').filter(Boolean);

  // Fetch meetings - either all or filtered by IDs
  const meetings = ids && ids.length > 0
    ? await getMeetingsByIds(ids)
    : await getAllMeetingsWithAnalysis();

  // Calculate analytics from meetings
  const analytics = calculateAnalytics(meetings);

  return (
    <div className="container">
      <h1>Dashboard de Métricas</h1>

      {/* Show selection indicator if IDs present */}
      {ids && ids.length > 0 && (
        <div className={styles.selectionBanner}>
          <span>Mostrando métricas de {ids.length} reuniones seleccionadas</span>
          <a href="/" className={styles.clearLink}>Ver todas</a>
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
