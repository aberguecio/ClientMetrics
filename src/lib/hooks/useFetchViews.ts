'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedView } from '@/types/charts';

/**
 * Custom hook for fetching saved views from API
 *
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Object containing views array, loading state, error, and refetch function
 *
 * @example
 * const { views, loading, error, refetch } = useFetchViews();
 */
export function useFetchViews(autoFetch: boolean = true) {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchViews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/views');

      if (!response.ok) {
        throw new Error(`Falló al obtener las vistas: ${response.statusText}`);
      }

      const result = await response.json();
      // Unwrap the data from the standardized API response
      const data = result.data || result;

      setViews(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Falló al obtener las vistas';
      console.error('[useFetchViews] Error:', err);
      setError(errorMessage);
      setViews([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchViews();
    }
  }, [autoFetch, fetchViews]);

  return {
    views,
    loading,
    error,
    refetch: fetchViews
  };
}
