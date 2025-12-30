'use client';

import { useState, useEffect } from 'react';
import type { SavedFilter } from '@/types/charts';
import styles from './FilterBuilder.module.css';
import { getSectorOptions, getDiscoveryChannelOptions, getCompanySizeOptions } from '@/lib/constants/llm-enums';

interface FilterBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
  editFilter?: SavedFilter;
}

export default function FilterBuilder({ isOpen, onClose, editFilter, onSave }: FilterBuilderProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [filterData, setFilterData] = useState({
    sales_rep: '',
    closed: '',
    date_from: '',
    date_to: '',
    sector: '',
    company_size: '',
    discovery_channel: '',
  });
  const [saving, setSaving] = useState(false);

  // Reset form when modal opens or editFilter changes
  useEffect(() => {
    if (editFilter) {
      setName(editFilter.name);
      setDescription(editFilter.description || '');
      setFilterData({
        sales_rep: editFilter.filter_data?.sales_rep || '',
        closed: editFilter.filter_data?.closed !== undefined ? String(editFilter.filter_data.closed) : '',
        date_from: editFilter.filter_data?.date_from || '',
        date_to: editFilter.filter_data?.date_to || '',
        sector: editFilter.filter_data?.sector || '',
        company_size: editFilter.filter_data?.company_size || '',
        discovery_channel: editFilter.filter_data?.discovery_channel || '',
      });
    } else {
      setName('');
      setDescription('');
      setFilterData({
        sales_rep: '',
        closed: '',
        date_from: '',
        date_to: '',
        sector: '',
        company_size: '',
        discovery_channel: '',
      });
    }
  }, [editFilter, isOpen]);

  if (!isOpen) return null;

  const handleFilterChange = (key: string, value: string) => {
    setFilterData(prev => ({
      ...prev,
      [key]: value === 'all' ? '' : value,
    }));
  };

  async function handleSave() {
    if (!name.trim()) {
      alert('Por favor ingresa un nombre para el filtro');
      return;
    }

    setSaving(true);
    try {
      const method = editFilter ? 'PUT' : 'POST';
      const url = editFilter ? `/api/filters/${editFilter.id}` : '/api/filters';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          filter_data: {
            sales_rep: filterData.sales_rep || undefined,
            closed: filterData.closed ? filterData.closed === 'true' : undefined,
            date_from: filterData.date_from || undefined,
            date_to: filterData.date_to || undefined,
            sector: filterData.sector || undefined,
            company_size: filterData.company_size || undefined,
            discovery_channel: filterData.discovery_channel || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save filter');
      }

      if (onSave) {
        onSave();
      } else {
        window.location.reload();
      }

      onClose();
    } catch (error) {
      alert('Error al guardar el filtro: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editFilter ? 'Edit Filter' : 'Create New Filter'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          {/* Basic Info */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Información Básica</h3>
            <div className={styles.formGrid}>
              <div>
                <label htmlFor="name" className={styles.label}>
                  Nombre del Filtro *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Ventas cerradas Q4"
                  className={styles.input}
                />
              </div>

              <div>
                <label htmlFor="description" className={styles.label}>
                  Descripción (opcional)
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descripción del filtro..."
                  rows={2}
                  className={styles.input}
                />
              </div>
            </div>
          </div>

          {/* Filter Criteria */}
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Criterios de Filtrado</h3>
            <div className={styles.formGrid}>
              {/* Sales Rep */}
              <div>
                <label htmlFor="salesRep" className={styles.label}>
                  Vendedor:
                </label>
                <select
                  id="salesRep"
                  className={styles.input}
                  value={filterData.sales_rep || 'all'}
                  onChange={(e) => handleFilterChange('sales_rep', e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="Toro">Toro</option>
                  <option value="Puma">Puma</option>
                  <option value="Leon">Leon</option>
                  <option value="Tigre">Tigre</option>
                  <option value="Pantera">Pantera</option>
                </select>
              </div>

              {/* Closed Status */}
              <div>
                <label htmlFor="closed" className={styles.label}>
                  Estado:
                </label>
                <select
                  id="closed"
                  className={styles.input}
                  value={filterData.closed || 'all'}
                  onChange={(e) => handleFilterChange('closed', e.target.value)}
                >
                  <option value="all">Todas</option>
                  <option value="true">Cerradas</option>
                  <option value="false">Abiertas</option>
                </select>
              </div>

              {/* Sector */}
              <div>
                <label htmlFor="sector" className={styles.label}>
                  Sector:
                </label>
                <select
                  id="sector"
                  className={styles.input}
                  value={filterData.sector || 'all'}
                  onChange={(e) => handleFilterChange('sector', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {getSectorOptions().map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Company Size */}
              <div>
                <label htmlFor="company_size" className={styles.label}>
                  Tamaño empresa:
                </label>
                <select
                  id="company_size"
                  className={styles.input}
                  value={filterData.company_size || 'all'}
                  onChange={(e) => handleFilterChange('company_size', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {getCompanySizeOptions().map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Discovery Channel */}
              <div>
                <label htmlFor="discovery_channel" className={styles.label}>
                  Canal:
                </label>
                <select
                  id="discovery_channel"
                  className={styles.input}
                  value={filterData.discovery_channel || 'all'}
                  onChange={(e) => handleFilterChange('discovery_channel', e.target.value)}
                >
                  <option value="all">Todos</option>
                  {getDiscoveryChannelOptions().map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <label htmlFor="date_from" className={styles.label}>
                  Desde:
                </label>
                <input
                  id="date_from"
                  type="date"
                  className={styles.input}
                  value={filterData.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                />
              </div>

              {/* Date To */}
              <div>
                <label htmlFor="date_to" className={styles.label}>
                  Hasta:
                </label>
                <input
                  id="date_to"
                  type="date"
                  className={styles.input}
                  value={filterData.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving} className={styles.primaryButton}>
            {saving ? 'Saving...' : editFilter ? 'Update Filter' : 'Create Filter'}
          </button>
        </div>
      </div>
    </div>
  );
}
