'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SavedView } from '@/types/charts';
import styles from './ViewSelector.module.css';

interface ViewSelectorProps {
  currentViewId?: string;
  showCreateButton?: boolean;
}

export default function ViewSelector({ currentViewId, showCreateButton = true }: ViewSelectorProps) {
  const router = useRouter();
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViews();
  }, []);

  async function fetchViews() {
    try {
      const response = await fetch('/api/views');
      if (!response.ok) throw new Error('Failed to fetch views');
      const data = await response.json();
      setViews(data);
    } catch (error) {
      console.error('Error fetching views:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleViewChange(viewId: string) {
    if (viewId === 'create') {
      // Redirect to views page where user can create new view
      router.push('/views');
    } else if (viewId) {
      router.push(`/views/${viewId}`);
    } else {
      // Empty value means default dashboard
      router.push('/');
    }
  }

  return (
    <div className={styles.container}>
      <label htmlFor="view-selector" className={styles.label}>
        Select View:
      </label>
      <select
        id="view-selector"
        value={currentViewId || ''}
        onChange={(e) => handleViewChange(e.target.value)}
        disabled={loading}
        className={styles.select}
      >
        <option value="">Dashboard (Default)</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name} {view.is_default ? '(Default)' : ''}
          </option>
        ))}
        {showCreateButton && <option value="create">+ Create New View</option>}
      </select>
    </div>
  );
}
