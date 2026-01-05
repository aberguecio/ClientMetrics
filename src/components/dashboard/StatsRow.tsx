'use client';

import { useState, useEffect } from 'react';
import StatsCard from '@/components/dashboard/StatsCard';
import { mergeFilters } from '@/lib/filters/merger';
import type { SavedView, SavedFilter } from '@/types/charts';
import type { AnalyticsData } from '@/types/api';
import styles from './StatsRow.module.css';

interface ViewWithFilters {
  filters?: SavedFilter[];
}

interface StatsRowProps {
  view: ViewWithFilters | null;
}

export default function StatsRow({ view }: StatsRowProps) {
  const [stats, setStats] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function calculateStats() {
      setLoading(true);

      try {
        // Merge view filters
        const viewFilters = view?.filters || [];
        const mergedFilter = viewFilters.length > 0
          ? mergeFilters(viewFilters)
          : {};

        // Fetch filtered meetings and calculate analytics
        const response = await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filter: mergedFilter }),
        });

        if (response.ok) {
          const result = await response.json();
          // Unwrap the data from the standardized API response
          setStats(result.data || result);
        } else {
          console.error('Failed to fetch analytics');
          setStats(null);
        }
      } catch (error) {
        console.error('Error calculating stats:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    calculateStats();
  }, [view]);

  if (loading) {
    return (
      <div className={styles.statsRow}>
        <StatsCard label="Total Reuniones" value="..." />
        <StatsCard label="Win Rate" value="..." />
        <StatsCard label="Confianza Promedio" value="..." />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={styles.statsRow}>
        <StatsCard label="Total Reuniones" value="0" />
        <StatsCard label="Win Rate" value="0%" />
        <StatsCard label="Confianza Promedio" value="N/A" />
      </div>
    );
  }

  return (
    <div className={styles.statsRow}>
      <StatsCard label="Total Reuniones" value={stats.total} />
      <StatsCard label="Win Rate" value={`${stats.winRate}%`} />
      <StatsCard
        label="Confianza Promedio"
        value={stats.avgConfidence > 0 ? stats.avgConfidence.toFixed(2) : 'N/A'}
      />
    </div>
  );
}
