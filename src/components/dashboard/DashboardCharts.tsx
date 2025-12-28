'use client';

import { PieChart, Pie, BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { AnalyticsData } from '@/types/api';
import styles from './DashboardCharts.module.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

interface DashboardChartsProps {
  data: AnalyticsData;
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
  // Filter out empty data
  const hasSectorData = data.bySector && data.bySector.length > 0;
  const hasInterestData = data.byInterest && data.byInterest.length > 0;
  const hasSentimentData = data.bySentiment && data.bySentiment.length > 0;

  if (!hasSectorData && !hasInterestData && !hasSentimentData) {
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

      {/* Niveles de Interés */}
      {hasInterestData && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Niveles de Interés</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.byInterest}>
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#3b82f6" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Análisis de Sentimiento */}
      {hasSentimentData && (
        <div className={styles.chartCard}>
          <h3 className={styles.chartTitle}>Análisis de Sentimiento</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.bySentiment}>
              <XAxis dataKey="sentiment" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#10b981" name="Cantidad" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
