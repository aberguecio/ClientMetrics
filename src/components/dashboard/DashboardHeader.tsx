'use client';

import ViewSelector from '@/components/views/ViewSelector';
import type { SavedView } from '@/types/charts';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  views: SavedView[];
  activeViewId: string | null;
  onViewChange: (viewId: string) => void;
}

export default function DashboardHeader({
  views,
  activeViewId,
  onViewChange,
}: DashboardHeaderProps) {
  return (
    <div className={styles.dashboardHeader}>
      <h1>Dashboard de Métricas</h1>
      <div className={styles.controls}>
        <ViewSelector
          views={views}
          activeViewId={activeViewId}
          onChange={onViewChange}
          inPlaceMode={true}
        />
      </div>
    </div>
  );
}
