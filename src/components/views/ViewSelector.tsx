'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SavedView } from '@/types/charts';
import styles from './ViewSelector.module.css';

interface ViewSelectorProps {
  currentViewId?: string;
  showCreateButton?: boolean;
  // New props for in-place mode (dashboard)
  views?: SavedView[];
  activeViewId?: string | null;
  onChange?: (viewId: string) => void;
  inPlaceMode?: boolean;
}

export default function ViewSelector({
  currentViewId,
  showCreateButton = true,
  views: propViews,
  activeViewId,
  onChange,
  inPlaceMode = false,
}: ViewSelectorProps) {
  const router = useRouter();
  const [localViews, setLocalViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  // Use prop views if provided (in-place mode), otherwise fetch
  const views = inPlaceMode && propViews ? propViews : localViews;
  const selectedId = inPlaceMode ? activeViewId : currentViewId;

  useEffect(() => {
    // Only fetch if not in in-place mode
    if (!inPlaceMode) {
      fetchViews();
    } else {
      setLoading(false);
    }
  }, [inPlaceMode]);

  async function fetchViews() {
    try {
      const response = await fetch('/api/views');
      if (!response.ok) throw new Error('Failed to fetch views');
      const data = await response.json();
      setLocalViews(data);
    } catch (error) {
      console.error('Error fetching views:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleViewChange(viewId: string) {
    if (inPlaceMode && onChange) {
      // In-place mode: use callback
      onChange(viewId);
    } else {
      // Navigation mode: use router
      if (viewId === 'create') {
        router.push('/views');
      } else if (viewId) {
        router.push(`/views/${viewId}`);
      } else {
        router.push('/');
      }
    }
  }

  return (
    <div className={styles.container}>
      <label htmlFor="view-selector" className={styles.label}>
        Select View:
      </label>
      <select
        id="view-selector"
        value={selectedId || ''}
        onChange={(e) => handleViewChange(e.target.value)}
        disabled={loading}
        className={styles.select}
      >
        <option value="">Select View...</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name} {view.is_default ? '(Default)' : ''}
          </option>
        ))}
        {showCreateButton && !inPlaceMode && <option value="create">+ Create New View</option>}
      </select>
    </div>
  );
}
