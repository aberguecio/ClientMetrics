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
  const activeView = views.find(v => v.id === activeViewId);

  return (
    <div className={styles.dashboardHeader}>
      {/* Primera fila: Controles principales */}
      <div className={styles.topRow}>
        <ViewSelector
          views={views}
          activeViewId={activeViewId}
          onChange={onViewChange}
          inPlaceMode={true}
        />
        <button onClick={onCreateView} className="btn-success">
          + Crear Vista
        </button>
        <button onClick={onManageFilters} className="btn-neutral">
          Filtros
        </button>
        <ViewFilterDropdown
          allFilters={allFilters}
          activeFilterIds={activeFilterIds}
          onFilterToggle={onFilterToggle}
        />
      </div>

      {/* Segunda fila: Nombre de vista + acciones */}
      {hasActiveView && activeView && (
        <div className={styles.bottomRow}>
          <div className={styles.viewInfo}>
            <h1 className={styles.viewName}>{activeView.name}</h1>
            <button onClick={onEditView} className="btn-icon" title="Editar Vista">
              ✏️
            </button>
            <button onClick={onDeleteView} className="btn-icon" title="Eliminar Vista">
              🗑️
            </button>
          </div>
          <button onClick={onCreateChart} className="btn-featured">
            + Crear Gráfico
          </button>
        </div>
      )}
    </div>
  );
}
