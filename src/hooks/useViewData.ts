import { useState, useEffect } from 'react';
import type { ViewWithDetails } from '@/types/charts';

export function useViewData(viewId: string | null, refreshKey: number) {
  const [view, setView] = useState<ViewWithDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadView() {
      if (!viewId) {
        setView(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/views/${viewId}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch view: ${response.statusText}`);
        }

        const data = await response.json();

        if (!cancelled) {
          setView(data);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setLoading(false);
          setView(null);
        }
      }
    }

    loadView();

    // Cleanup function to avoid race conditions
    return () => {
      cancelled = true;
    };
  }, [viewId, refreshKey]);

  return { view, loading, error };
}
