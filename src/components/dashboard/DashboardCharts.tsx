'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { AnalyticsData } from '@/types/api';
import styles from './DashboardCharts.module.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface DashboardChartsProps {
  data: AnalyticsData;
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Filter out empty data
  const hasSectorData = data.bySector && data.bySector.length > 0;

  if (!hasSectorData) {
    return (
      <div className={styles.noData}>
        <p>No hay datos de análisis disponibles todavía</p>
      </div>
    );
  }

  return (
    <div className={styles.chartsGrid}>
      {/* Distribución por Sector */}
      {hasSectorData && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Distribución por Sector</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.bySector}
                dataKey="count"
                nameKey="sector"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => `${entry.sector}: ${entry.count}`}
              >
                {data.bySector.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
