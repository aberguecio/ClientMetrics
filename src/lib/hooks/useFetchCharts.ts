'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedChart } from '@/types/charts';

/**
 * Custom hook for fetching saved charts from API
 *
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Object containing charts array, loading state, error, and refetch function
 *
 * @example
 * const { charts, loading, error, refetch } = useFetchCharts();
 */
export function useFetchCharts(autoFetch: boolean = true) {
  const [charts, setCharts] = useState<SavedChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCharts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/charts');

      if (!response.ok) {
        throw new Error(`Failed to fetch charts: ${response.statusText}`);
      }

      const result = await response.json();
      // Unwrap the data from the standardized API response
      const data = result.data || result;

      setCharts(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch charts';
      console.error('[useFetchCharts] Error:', err);
      setError(errorMessage);
      setCharts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCharts();
    }
  }, [autoFetch, fetchCharts]);

  return {
    charts,
    loading,
    error,
    refetch: fetchCharts
  };
}
