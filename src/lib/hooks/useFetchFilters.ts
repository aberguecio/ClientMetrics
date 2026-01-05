'use client';

import { useState, useEffect, useCallback } from 'react';
import type { SavedFilter } from '@/types/charts';

/**
 * Custom hook for fetching saved filters from API
 *
 * @param autoFetch - Whether to automatically fetch on mount (default: true)
 * @returns Object containing filters array, loading state, error, and refetch function
 *
 * @example
 * const { filters, loading, error, refetch } = useFetchFilters();
 */
export function useFetchFilters(autoFetch: boolean = true) {
  const [filters, setFilters] = useState<SavedFilter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFilters = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/filters');

      if (!response.ok) {
        throw new Error(`Failed to fetch filters: ${response.statusText}`);
      }

      const result = await response.json();
      // Unwrap the data from the standardized API response
      const data = result.data || result;

      setFilters(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch filters';
      console.error('[useFetchFilters] Error:', err);
      setError(errorMessage);
      setFilters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchFilters();
    }
  }, [autoFetch, fetchFilters]);

  return {
    filters,
    loading,
    error,
    refetch: fetchFilters
  };
}
