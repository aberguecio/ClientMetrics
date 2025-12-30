'use client';

import { useState, useEffect } from 'react';
import { useDashboardState } from '@/hooks/useDashboardState';
import { useViewData } from '@/hooks/useViewData';
import DashboardHeader from './DashboardHeader';
import StatsRow from './StatsRow';
import DashboardViewContent from './DashboardViewContent';
import DashboardActions from './DashboardActions';
import ChartBuilderModal from '@/components/charts/ChartBuilderModal';
import ViewManager from '@/components/views/ViewManager';
import FilterBuilder from '@/components/filters/FilterBuilder';
import type { SavedView } from '@/types/charts';

export default function DashboardPageClient() {
  const {
    activeViewId,
    setActiveViewId,
    modalsState,
    openChartModal,
    closeChartModal,
    openViewModal,
    closeViewModal,
    openFilterModal,
    closeFilterModal,
    refresh,
    refreshKey,
  } = useDashboardState();

  const { view, loading, error } = useViewData(activeViewId, refreshKey);
  const [views, setViews] = useState<SavedView[]>([]);
  const [viewsLoading, setViewsLoading] = useState(false);

  // Load all views for selector
  useEffect(() => {
    async function fetchViews() {
      setViewsLoading(true);
      try {
        const response = await fetch('/api/views');
        if (response.ok) {
          const data = await response.json();
          setViews(data);
        }
      } catch (error) {
        console.error('Error fetching views:', error);
      } finally {
        setViewsLoading(false);
      }
    }
    fetchViews();
  }, [refreshKey]);

  // Load default view on mount
  useEffect(() => {
    async function loadDefaultView() {
      try {
        const response = await fetch('/api/views/default');
        if (response.ok) {
          const defaultView = await response.json();
          if (defaultView && defaultView.id) {
            setActiveViewId(defaultView.id);
          }
        }
      } catch (error) {
        console.error('Error loading default view:', error);
      }
    }
    loadDefaultView();
  }, [setActiveViewId]);

  async function handleDeleteChart(chartId: string) {
    if (!activeViewId) return;

    if (!confirm('Remove this chart from the view?')) return;

    try {
      const response = await fetch(`/api/views/${activeViewId}/charts/${chartId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        refresh();
      } else {
        alert('Failed to remove chart');
      }
    } catch (error) {
      console.error('Error deleting chart:', error);
      alert('Error deleting chart');
    }
  }

  return (
    <div className="container">
      <DashboardHeader
        views={views}
        activeViewId={activeViewId}
        onViewChange={setActiveViewId}
      />

      <StatsRow view={view} />

      {error && (
        <div style={{ color: 'red', padding: '1rem', background: '#fee', borderRadius: '0.5rem', marginBottom: '1rem' }}>
          Error loading view: {error}
        </div>
      )}

      <DashboardViewContent
        view={view}
        onRefresh={refresh}
        onEditChart={openChartModal}
        onDeleteChart={handleDeleteChart}
      />

      <DashboardActions
        onCreateChart={() => openChartModal()}
        onManageView={() => openViewModal()}
        onManageFilters={() => openFilterModal()}
      />

      {/* Modals */}
      <ChartBuilderModal
        isOpen={modalsState.chart.isOpen}
        onClose={closeChartModal}
        editChart={modalsState.chart.editItem}
        currentViewId={activeViewId}
        autoAddToView={true}
        onSave={refresh}
      />

      <ViewManager
        isOpen={modalsState.view.isOpen}
        onClose={closeViewModal}
        editView={modalsState.view.editItem}
        onSave={refresh}
      />

      <FilterBuilder
        isOpen={modalsState.filter.isOpen}
        onClose={closeFilterModal}
        editFilter={modalsState.filter.editItem}
        onSave={refresh}
      />
    </div>
  );
}
