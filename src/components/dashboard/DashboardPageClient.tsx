'use client';

import { useState, useEffect } from 'react';
import { useFetchViews, useFetchFilters, useModalState } from '@/lib/hooks';
import { LoadingState } from '@/components/common';
import DashboardHeader from './DashboardHeader';
import ChartsGrid from './ChartsGrid';
import ChartBuilderModal from '@/components/charts/ChartBuilderModal';
import ViewManager from '@/components/views/ViewManager';
import FilterBuilder from '@/components/filters/FilterBuilder';
import type { SavedChart, SavedFilter, SavedView } from '@/types/charts';

// Type for view with details
interface ViewWithDetails extends SavedView {
  charts: Array<SavedChart & { position: number; width: string; chart_filter?: SavedFilter }>;
  filters: SavedFilter[];
}

export default function DashboardPageClient() {
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [view, setView] = useState<ViewWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);

  // Use custom hooks
  const { views, refetch: refetchViews } = useFetchViews();
  const { filters: allFilters, refetch: refetchFilters } = useFetchFilters();

  // Modal states with custom hook
  const chartModal = useModalState<SavedChart>();
  const viewModal = useModalState<SavedView>();
  const filterModal = useModalState();

  // Load default view on mount
  useEffect(() => {
    loadDefaultView();
  }, []);

  // Load active view details when activeViewId changes
  useEffect(() => {
    if (activeViewId) {
      fetchViewDetails(activeViewId);
    } else {
      setView(null);
      setLoading(false);
    }
  }, [activeViewId]);

  // Initialize active filters from view
  useEffect(() => {
    if (view?.filters) {
      setActiveFilterIds(view.filters.map(f => f.id));
    } else {
      setActiveFilterIds([]);
    }
  }, [view]);

  async function loadDefaultView() {
    try {
      const response = await fetch('/api/views/default');
      if (response.ok) {
        const result = await response.json();
        const defaultView = result.data || result;
        if (defaultView?.id) {
          setActiveViewId(defaultView.id);
        }
      }
    } catch (error) {
      console.error('Error loading default view:', error);
    }
  }

  async function fetchViewDetails(viewId: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/views/${viewId}`);
      if (response.ok) {
        const result = await response.json();
        setView(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching view details:', error);
    } finally {
      setLoading(false);
    }
  }

  function refresh() {
    refetchViews();
    refetchFilters();
    if (activeViewId) {
      fetchViewDetails(activeViewId);
    }
  }

  async function handleDeleteChart(chartId: string) {
    if (!activeViewId) return;
    if (!confirm('¿Eliminar este gráfico de la vista?')) return;

    try {
      const response = await fetch(`/api/views/${activeViewId}/charts/${chartId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        refresh();
      } else {
        alert('Error al eliminar el gráfico');
      }
    } catch (error) {
      console.error('Error deleting chart:', error);
      alert('Error al eliminar el gráfico');
    }
  }

  function handleEditChart(chart: SavedChart) {
    chartModal.openWithItem(chart);
  }

  function handleCreateChart() {
    chartModal.open();
  }

  function handleCreateView() {
    viewModal.open();
  }

  function handleEditView() {
    if (view) {
      viewModal.openWithItem(view);
    }
  }

  async function handleDeleteView() {
    if (!activeViewId) return;
    if (!confirm('¿Estás seguro de eliminar esta vista?')) return;

    try {
      const response = await fetch(`/api/views/${activeViewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setActiveViewId(null);
        refresh();
      } else {
        alert('Error al eliminar la vista');
      }
    } catch (error) {
      console.error('Error deleting view:', error);
      alert('Error al eliminar la vista');
    }
  }

  function handleFilterToggle(filterId: string) {
    setActiveFilterIds(prev => {
      if (prev.includes(filterId)) {
        return prev.filter(id => id !== filterId);
      } else {
        return [...prev, filterId];
      }
    });
  }

  function handleEditFilter(filterId: string) {
    const filter = allFilters.find(f => f.id === filterId);
    if (filter) {
      filterModal.openWithItem(filter);
    }
  }

  async function handleDeleteFilter(filterId: string) {
    if (!confirm('¿Eliminar este filtro? Se removerá de todas las vistas que lo usen.')) {
      return;
    }

    try {
      const response = await fetch(`/api/filters/${filterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Actualizar lista de filtros
        refetchFilters();

        // Si el filtro eliminado estaba activo, removerlo
        setActiveFilterIds(prev => prev.filter(id => id !== filterId));

        // Refrescar vista actual
        if (activeViewId) {
          fetchViewDetails(activeViewId);
        }
      } else {
        alert('Error al eliminar el filtro');
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
      alert('Error al eliminar el filtro');
    }
  }

  return (
    <div className="container">
      <DashboardHeader
        views={views}
        activeViewId={activeViewId}
        onViewChange={setActiveViewId}
        onCreateChart={handleCreateChart}
        onCreateView={handleCreateView}
        onEditView={handleEditView}
        onDeleteView={handleDeleteView}
        onManageFilters={filterModal.open}
        allFilters={allFilters}
        activeFilterIds={activeFilterIds}
        onFilterToggle={handleFilterToggle}
        onEditFilter={handleEditFilter}
        onDeleteFilter={handleDeleteFilter}
        hasActiveView={!!activeViewId}
      />

      {loading ? (
        <LoadingState message="Cargando vista..." />
      ) : !view ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          <p>No hay vista seleccionada.</p>
          <p>Selecciona una vista o crea una nueva.</p>
        </div>
      ) : (
        <ChartsGrid
          charts={view.charts || []}
          loading={false}
          activeFilterIds={activeFilterIds}
          onEditChart={handleEditChart}
          onDeleteChart={handleDeleteChart}
        />
      )}

      {/* Modals */}
      <ChartBuilderModal
        isOpen={chartModal.isOpen}
        onClose={chartModal.close}
        editChart={chartModal.editingItem}
        currentViewId={activeViewId}
        autoAddToView={true}
        onSave={refresh}
      />

      <ViewManager
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        editView={viewModal.editingItem}
        onSave={refresh}
      />

      <FilterBuilder
        isOpen={filterModal.isOpen}
        onClose={filterModal.close}
        onSave={refresh}
        editFilter={filterModal.editingItem}
      />
    </div>
  );
}
