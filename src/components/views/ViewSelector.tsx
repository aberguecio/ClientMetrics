'use client';

import { useRouter } from 'next/navigation';
import { useFetchViews } from '@/lib/hooks';
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
  const { views: fetchedViews, loading } = useFetchViews(!inPlaceMode);

  // Use prop views if provided (in-place mode), otherwise use fetched views
  const views = inPlaceMode && propViews ? propViews : fetchedViews;
  const selectedId = inPlaceMode ? activeViewId : currentViewId;

  // In inPlaceMode, loading should not disable the select since views come from props
  const isDisabled = inPlaceMode ? false : loading;

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
        Seleccionar vista:
      </label>
      <select
        id="view-selector"
        value={selectedId || ''}
        onChange={(e) => handleViewChange(e.target.value)}
        disabled={isDisabled}
        className={styles.select}
      >
        <option value="">Seleccionar vista...</option>
        {views.map((view) => (
          <option key={view.id} value={view.id}>
            {view.name} {view.is_default ? '(Predeterminado)' : ''}
          </option>
        ))}
        {showCreateButton && !inPlaceMode && <option value="create">+ Crear nueva vista</option>}
      </select>
    </div>
  );
}
