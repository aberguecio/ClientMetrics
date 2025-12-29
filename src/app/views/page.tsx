'use client';

import { useEffect, useState } from 'react';
import ViewCard from '@/components/views/ViewCard';
import ViewManager from '@/components/views/ViewManager';
import type { SavedView } from '@/types/charts';

export default function ViewsPage() {
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

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

  async function handleDelete(viewId: string) {
    if (!confirm('Are you sure you want to delete this view?')) return;

    try {
      const response = await fetch(`/api/views/${viewId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete view');
      setViews(views.filter((v) => v.id !== viewId));
    } catch (error) {
      alert('Error deleting view: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>My Views</h1>
        <button
          onClick={() => setIsCreating(true)}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Create New View
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '3rem' }}>Loading views...</div>}

      {!loading && views.length === 0 && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>No views created yet.</p>
          <p>Create your first custom dashboard view!</p>
        </div>
      )}

      {!loading && views.length > 0 && (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {views.map((view) => (
            <ViewCard
              key={view.id}
              view={view}
              onDelete={() => handleDelete(view.id)}
            />
          ))}
        </div>
      )}

      <ViewManager
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </div>
  );
}
