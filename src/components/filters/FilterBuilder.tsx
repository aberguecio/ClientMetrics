'use client';

import { useState } from 'react';
import type { SavedFilter } from '@/types/charts';
import styles from './FilterBuilder.module.css';

interface FilterBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (filter: SavedFilter) => void;
  editFilter?: SavedFilter;
}

export default function FilterBuilder({ isOpen, onClose, editFilter }: FilterBuilderProps) {
  const [name, setName] = useState(editFilter?.name || '');
  const [description, setDescription] = useState(editFilter?.description || '');
  const [salesRep, setSalesRep] = useState(editFilter?.filter_data?.sales_rep || '');
  const [closed, setClosed] = useState<string>(editFilter?.filter_data?.closed !== undefined ? String(editFilter.filter_data.closed) : '');
  const [sector, setSector] = useState(editFilter?.filter_data?.sector || '');
  const [dateFrom, setDateFrom] = useState(editFilter?.filter_data?.date_from || '');
  const [dateTo, setDateTo] = useState(editFilter?.filter_data?.date_to || '');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  async function handleSave() {
    if (!name) {
      alert('Please enter a filter name');
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
            sales_rep: salesRep || undefined,
            closed: closed ? closed === 'true' : undefined,
            sector: sector || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save filter');
      }

      window.location.reload(); // Refresh to show new filter
    } catch (error) {
      alert('Error saving filter: ' + (error instanceof Error ? error.message : 'Unknown error'));
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
          <div className={styles.formGrid}>
            <div>
              <label htmlFor="name" className={styles.label}>
                Filter Name *
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q4 Closed Sales"
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="salesRep" className={styles.label}>
                Sales Rep
              </label>
              <input
                id="salesRep"
                type="text"
                value={salesRep}
                onChange={(e) => setSalesRep(e.target.value)}
                placeholder="e.g., María García"
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="closed" className={styles.label}>
                Closed Status
              </label>
              <select
                id="closed"
                value={closed}
                onChange={(e) => setClosed(e.target.value)}
                className={styles.input}
              >
                <option value="">Any</option>
                <option value="true">Closed</option>
                <option value="false">Open</option>
              </select>
            </div>

            <div>
              <label htmlFor="sector" className={styles.label}>
                Sector
              </label>
              <input
                id="sector"
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                placeholder="e.g., Technology"
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="dateFrom" className={styles.label}>
                Date From
              </label>
              <input
                id="dateFrom"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className={styles.input}
              />
            </div>

            <div>
              <label htmlFor="dateTo" className={styles.label}>
                Date To
              </label>
              <input
                id="dateTo"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className={styles.input}
              />
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
