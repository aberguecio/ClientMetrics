import { useState } from 'react';
import type { SavedChart, ViewWithDetails, SavedFilter } from '@/types/charts';

interface ModalState<T> {
  isOpen: boolean;
  editItem?: T;
}

interface ModalsState {
  chart: ModalState<SavedChart>;
  view: ModalState<ViewWithDetails>;
  filter: ModalState<SavedFilter>;
}

export function useDashboardState() {
  const [activeViewId, setActiveViewId] = useState<string | null>(null);
  const [modalsState, setModalsState] = useState<ModalsState>({
    chart: { isOpen: false, editItem: undefined },
    view: { isOpen: false, editItem: undefined },
    filter: { isOpen: false, editItem: undefined },
  });
  const [refreshKey, setRefreshKey] = useState(0);

  // Chart modal functions
  const openChartModal = (chart?: SavedChart) => {
    setModalsState(prev => ({
      ...prev,
      chart: { isOpen: true, editItem: chart },
    }));
  };

  const closeChartModal = () => {
    setModalsState(prev => ({
      ...prev,
      chart: { isOpen: false, editItem: undefined },
    }));
  };

  // View modal functions
  const openViewModal = (view?: ViewWithDetails) => {
    setModalsState(prev => ({
      ...prev,
      view: { isOpen: true, editItem: view },
    }));
  };

  const closeViewModal = () => {
    setModalsState(prev => ({
      ...prev,
      view: { isOpen: false, editItem: undefined },
    }));
  };

  // Filter modal functions
  const openFilterModal = (filter?: SavedFilter) => {
    setModalsState(prev => ({
      ...prev,
      filter: { isOpen: true, editItem: filter },
    }));
  };

  const closeFilterModal = () => {
    setModalsState(prev => ({
      ...prev,
      filter: { isOpen: false, editItem: undefined },
    }));
  };

  // Refresh function to trigger re-fetch
  const refresh = () => setRefreshKey(prev => prev + 1);

  return {
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
  };
}
