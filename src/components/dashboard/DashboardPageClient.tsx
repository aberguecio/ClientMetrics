'use client';

import { useState, useEffect } from 'react';
import DashboardHeader from './DashboardHeader';
import StatsRow from './StatsRow';
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
  const [views, setViews] = useState<SavedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [allFilters, setAllFilters] = useState<SavedFilter[]>([]);
  const [activeFilterIds, setActiveFilterIds] = useState<string[]>([]);

  // Modal states
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [editingChart, setEditingChart] = useState<SavedChart | undefined>();
  const [editingView, setEditingView] = useState<SavedView | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  // Load default view on mount
  useEffect(() => {
    loadDefaultView();
  }, []);

  // Load all views when refreshKey changes
  useEffect(() => {
    fetchViews();
  }, [refreshKey]);

  // Load active view details when activeViewId changes
  useEffect(() => {
    if (activeViewId) {
      fetchViewDetails(activeViewId);
    } else {
      setView(null);
      setLoading(false);
    }
  }, [activeViewId, refreshKey]);

  // Load all filters
  useEffect(() => {
    fetchFilters();
  }, [refreshKey]);

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
        // Unwrap the data from the standardized API response
        const defaultView = result.data || result;
        if (defaultView?.id) {
          setActiveViewId(defaultView.id);
        }
      }
    } catch (error) {
      console.error('Error loading default view:', error);
    }
  }

  async function fetchViews() {
    try {
      const response = await fetch('/api/views');
      if (response.ok) {
        const result = await response.json();
        // Unwrap the data from the standardized API response
        setViews(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching views:', error);
    }
  }

  async function fetchViewDetails(viewId: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/views/${viewId}`);
      if (response.ok) {
        const result = await response.json();
        // Unwrap the data from the standardized API response
        setView(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching view details:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFilters() {
    try {
      const response = await fetch('/api/filters');
      if (response.ok) {
        const result = await response.json();
        // Unwrap the data from the standardized API response
        setAllFilters(result.data || result);
      }
    } catch (error) {
      console.error('Error fetching filters:', error);
    }
  }

  function refresh() {
    setRefreshKey(prev => prev + 1);
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
    setEditingChart(chart);
    setIsChartModalOpen(true);
  }

  function handleCreateChart() {
    setEditingChart(undefined);
    setIsChartModalOpen(true);
  }

  function handleCreateView() {
    setEditingView(undefined);
    setIsViewModalOpen(true);
  }

  function handleEditView() {
    if (view) {
      setEditingView(view);
      setIsViewModalOpen(true);
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
        onManageFilters={() => setIsFilterModalOpen(true)}
        allFilters={allFilters}
        activeFilterIds={activeFilterIds}
        onFilterToggle={handleFilterToggle}
        hasActiveView={!!activeViewId}
      />

      <StatsRow view={view} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
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
        isOpen={isChartModalOpen}
        onClose={() => {
          setIsChartModalOpen(false);
          setEditingChart(undefined);
        }}
        editChart={editingChart}
        currentViewId={activeViewId}
        autoAddToView={true}
        onSave={refresh}
      />

      <ViewManager
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setEditingView(undefined);
        }}
        editView={editingView}
        onSave={refresh}
      />

      <FilterBuilder
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onSave={refresh}
      />
    </div>
  );
}
