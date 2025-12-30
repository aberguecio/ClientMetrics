'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SavedFilter } from '@/types/charts';
import styles from './MeetingFilters.module.css';
import { getSectorOptions, getDiscoveryChannelOptions, getCompanySizeOptions } from '@/lib/constants/llm-enums';

export default function MeetingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilterId, setActiveFilterId] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filterDescription, setFilterDescription] = useState('');

  // Local filter state (not applied to URL yet)
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});
  const [hasAppliedFilters, setHasAppliedFilters] = useState(false);

  // Fetch saved filters on mount
  useEffect(() => {
    fetch('/api/filters')
      .then((r) => r.json())
      .then((data) => setSavedFilters(data))
      .catch((err) => console.error('Error fetching filters:', err));
  }, []);

  // Initialize local filters from URL params on mount
  useEffect(() => {
    const filters: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (key !== 'page') {
        filters[key] = value;
      }
    });
    setLocalFilters(filters);
    setHasAppliedFilters(Object.keys(filters).length > 0);
  }, []);

  const handleFilterChange = (key: string, value: string) => {
    // Update local state only, don't update URL yet
    setLocalFilters(prev => {
      const updated = { ...prev };
      if (value === 'all' || value === '') {
        delete updated[key];
      } else {
        updated[key] = value;
      }
      return updated;
    });
    // Clear active filter when manual changes are made
    setActiveFilterId(null);
    // Mark that filters have not been applied yet
    setHasAppliedFilters(false);
  };

  const handleApplyFilters = () => {
    // Apply local filters to URL
    const params = new URLSearchParams();
    Object.entries(localFilters).forEach(([key, value]) => {
      params.set(key, value);
    });
    // Reset page when applying filters
    params.delete('page');
    setHasAppliedFilters(true);
    router.push(`/meetings?${params.toString()}`);
  };

  const handleApplySavedFilter = (filterId: string) => {
    if (!filterId) {
      setActiveFilterId(null);
      setLocalFilters({});
      setHasAppliedFilters(false);
      router.push('/meetings');
      return;
    }

    const filter = savedFilters.find((f) => f.id === filterId);
    if (!filter) return;

    const params = new URLSearchParams();
    const newLocalFilters: Record<string, string> = {};

    // Apply all filter fields to both URL params and local state
    if (filter.filter_data.sales_rep) {
      params.set('salesRep', filter.filter_data.sales_rep);
      newLocalFilters.salesRep = filter.filter_data.sales_rep;
    }
    if (filter.filter_data.closed !== undefined && filter.filter_data.closed !== null) {
      params.set('closed', String(filter.filter_data.closed));
      newLocalFilters.closed = String(filter.filter_data.closed);
    }
    if (filter.filter_data.date_from) {
      params.set('date_from', filter.filter_data.date_from);
      newLocalFilters.date_from = filter.filter_data.date_from;
    }
    if (filter.filter_data.date_to) {
      params.set('date_to', filter.filter_data.date_to);
      newLocalFilters.date_to = filter.filter_data.date_to;
    }
    if (filter.filter_data.sector) {
      params.set('sector', filter.filter_data.sector);
      newLocalFilters.sector = filter.filter_data.sector;
    }
    if (filter.filter_data.company_size) {
      params.set('company_size', filter.filter_data.company_size);
      newLocalFilters.company_size = filter.filter_data.company_size;
    }
    if (filter.filter_data.discovery_channel) {
      params.set('discovery_channel', filter.filter_data.discovery_channel);
      newLocalFilters.discovery_channel = filter.filter_data.discovery_channel;
    }
    if (filter.filter_data.budget_range) {
      params.set('budget_range', filter.filter_data.budget_range);
      newLocalFilters.budget_range = filter.filter_data.budget_range;
    }
    if (filter.filter_data.decision_maker !== undefined && filter.filter_data.decision_maker !== null) {
      params.set('decision_maker', String(filter.filter_data.decision_maker));
      newLocalFilters.decision_maker = String(filter.filter_data.decision_maker);
    }
    if (filter.filter_data.pain_points) {
      params.set('pain_points', filter.filter_data.pain_points);
      newLocalFilters.pain_points = filter.filter_data.pain_points;
    }

    setActiveFilterId(filterId);
    setLocalFilters(newLocalFilters);
    setHasAppliedFilters(true);
    router.push(`/meetings?${params.toString()}`);
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) {
      alert('Por favor ingresa un nombre para el filtro');
      return;
    }

    if (!hasAppliedFilters) {
      alert('Debes aplicar los filtros antes de guardarlos');
      return;
    }

    const requestBody = {
      name: filterName,
      description: filterDescription,
      filter_data: {
        sales_rep: localFilters.salesRep || undefined,
        closed: localFilters.closed ? localFilters.closed === 'true' : undefined,
        date_from: localFilters.date_from || undefined,
        date_to: localFilters.date_to || undefined,
        sector: localFilters.sector || undefined,
        company_size: localFilters.company_size || undefined,
        discovery_channel: localFilters.discovery_channel || undefined,
        budget_range: localFilters.budget_range || undefined,
        decision_maker: localFilters.decision_maker ? localFilters.decision_maker === 'true' : undefined,
        pain_points: localFilters.pain_points || undefined,
      },
    };

    try {
      const response = await fetch('/api/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const newFilter = await response.json();
        setSavedFilters([...savedFilters, newFilter]);
        setActiveFilterId(newFilter.id);
        setShowSaveModal(false);
        setFilterName('');
        setFilterDescription('');
      } else {
        alert('Error al guardar el filtro');
      }
    } catch (error) {
      console.error('Error saving filter:', error);
      alert('Error al guardar el filtro');
    }
  };

  const handleDeleteFilter = async () => {
    if (!activeFilterId) return;

    if (!confirm('¿Estás seguro de eliminar este filtro?')) return;

    try {
      const response = await fetch(`/api/filters/${activeFilterId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSavedFilters(savedFilters.filter((f) => f.id !== activeFilterId));
        setActiveFilterId(null);
        setLocalFilters({});
        setHasAppliedFilters(false);
        router.push('/meetings');
      } else {
        alert('Error al eliminar el filtro');
      }
    } catch (error) {
      console.error('Error deleting filter:', error);
      alert('Error al eliminar el filtro');
    }
  };

  const handleClearFilters = () => {
    setActiveFilterId(null);
    setLocalFilters({});
    setHasAppliedFilters(false);
    router.push('/meetings');
  };

  return (
    <>
      <div className={styles.filters}>
        {/* Saved Filters Dropdown */}
        <div className={styles.filterGroup}>
          <label htmlFor="savedFilter" className={styles.label}>
            Filtros guardados:
          </label>
          <select
            id="savedFilter"
            className={styles.select}
            value={activeFilterId || ''}
            onChange={(e) => handleApplySavedFilter(e.target.value)}
          >
            <option value="">Seleccionar filtro...</option>
            {savedFilters.map((filter) => (
              <option key={filter.id} value={filter.id}>
                {filter.name}
              </option>
            ))}
          </select>
        </div>

        {/* Base Fields */}
        <div className={styles.filterGroup}>
          <label htmlFor="salesRep" className={styles.label}>
            Vendedor:
          </label>
          <select
            id="salesRep"
            className={styles.select}
            value={localFilters.salesRep || 'all'}
            onChange={(e) => handleFilterChange('salesRep', e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="Toro">Toro</option>
            <option value="Puma">Puma</option>
            <option value="Leon">Leon</option>
            <option value="Tigre">Tigre</option>
            <option value="Pantera">Pantera</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="closed" className={styles.label}>
            Estado:
          </label>
          <select
            id="closed"
            className={styles.select}
            value={localFilters.closed || 'all'}
            onChange={(e) => handleFilterChange('closed', e.target.value)}
          >
            <option value="all">Todas</option>
            <option value="true">Cerradas</option>
            <option value="false">Abiertas</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sector" className={styles.label}>
            Sector:
          </label>
          <select
            id="sector"
            className={styles.select}
            value={localFilters.sector || 'all'}
            onChange={(e) => handleFilterChange('sector', e.target.value)}
          >
            <option value="all">Todos</option>
            {getSectorOptions().map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="company_size" className={styles.label}>
            Tamaño empresa:
          </label>
          <select
            id="company_size"
            className={styles.select}
            value={localFilters.company_size || 'all'}
            onChange={(e) => handleFilterChange('company_size', e.target.value)}
          >
            <option value="all">Todos</option>
            {getCompanySizeOptions().map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="discovery_channel" className={styles.label}>
            Canal:
          </label>
          <select
            id="discovery_channel"
            className={styles.select}
            value={localFilters.discovery_channel || 'all'}
            onChange={(e) => handleFilterChange('discovery_channel', e.target.value)}
          >
            <option value="all">Todos</option>
            {getDiscoveryChannelOptions().map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="budget_range" className={styles.label}>
            Rango presupuesto:
          </label>
          <input
            id="budget_range"
            type="text"
            className={styles.input}
            value={localFilters.budget_range || ''}
            onChange={(e) => handleFilterChange('budget_range', e.target.value)}
            placeholder="Ej: $10k-$50k"
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="decision_maker" className={styles.label}>
            Decision maker:
          </label>
          <select
            id="decision_maker"
            className={styles.select}
            value={localFilters.decision_maker || 'all'}
            onChange={(e) => handleFilterChange('decision_maker', e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="true">Sí</option>
            <option value="false">No</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="date_from" className={styles.label}>
            Desde:
          </label>
          <input
            id="date_from"
            type="date"
            className={styles.input}
            value={localFilters.date_from || ''}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="date_to" className={styles.label}>
            Hasta:
          </label>
          <input
            id="date_to"
            type="date"
            className={styles.input}
            value={localFilters.date_to || ''}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <button
          className={styles.applyButton}
          onClick={handleApplyFilters}
        >
          Aplicar Filtros
        </button>

        <button
          className={styles.resetButton}
          onClick={handleClearFilters}
        >
          Limpiar filtros
        </button>

        {activeFilterId ? (
          <button className={styles.deleteButton} onClick={handleDeleteFilter}>
            Eliminar filtro
          </button>
        ) : (
          <button
            className={styles.saveButton}
            onClick={() => setShowSaveModal(true)}
            disabled={!hasAppliedFilters}
            title={!hasAppliedFilters ? 'Debes aplicar los filtros antes de guardarlos' : ''}
          >
            Guardar filtro
          </button>
        )}
      </div>

      {/* Save Filter Modal */}
      {showSaveModal && (
        <div className={styles.modalOverlay} onClick={() => setShowSaveModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3>Guardar filtro</h3>
            <div className={styles.modalField}>
              <label>Nombre:</label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Ej: Ventas cerradas Q4"
              />
            </div>
            <div className={styles.modalField}>
              <label>Descripción (opcional):</label>
              <textarea
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                placeholder="Descripción del filtro..."
              />
            </div>
            <div className={styles.modalActions}>
              <button onClick={() => setShowSaveModal(false)}>Cancelar</button>
              <button onClick={handleSaveFilter}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
