'use client';

import ViewSelector from '@/components/views/ViewSelector';
import ViewFilterDropdown from './ViewFilterDropdown';
import type { SavedView, SavedFilter } from '@/types/charts';
import styles from './DashboardHeader.module.css';

interface DashboardHeaderProps {
  views: SavedView[];
  activeViewId: string | null;
  onViewChange: (viewId: string) => void;
  onCreateChart: () => void;
  onCreateView: () => void;
  onEditView: () => void;
  onDeleteView: () => void;
  onManageFilters: () => void;
  allFilters: SavedFilter[];
  activeFilterIds: string[];
  onFilterToggle: (filterId: string) => void;
  hasActiveView: boolean;
}

export default function DashboardHeader({
  views,
  activeViewId,
  onViewChange,
  onCreateChart,
  onCreateView,
  onEditView,
  onDeleteView,
  onManageFilters,
  allFilters,
  activeFilterIds,
  onFilterToggle,
  hasActiveView,
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
        <button onClick={onCreateChart} className={styles.createBtn} disabled={!hasActiveView}>
          + Crear Gráfico
        </button>
        <button onClick={onCreateView} className={styles.createBtn}>
          + Crear Vista
        </button>
        {hasActiveView && (
          <>
            <button onClick={onEditView} className={styles.manageBtn}>
              ✏️ Editar Vista
            </button>
            <button onClick={onDeleteView} className={styles.deleteBtn}>
              🗑️ Eliminar Vista
            </button>
          </>
        )}
        <button onClick={onManageFilters} className={styles.manageBtn}>
          Filtros
        </button>
        <ViewFilterDropdown
          allFilters={allFilters}
          activeFilterIds={activeFilterIds}
          onFilterToggle={onFilterToggle}
        />
      </div>
    </div>
  );
}
