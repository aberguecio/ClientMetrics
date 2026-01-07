'use client';

import { useState, useEffect } from 'react';
import FilterSelector from '../filters/FilterSelector';
import type { SavedView, SavedFilter } from '@/types/charts';
import styles from './ViewManager.module.css';

interface ViewManagerProps {
  isOpen: boolean;
  onClose: () => void;
  editView?: SavedView & { filters?: SavedFilter[] };
  onSave?: () => void; // Callback for refresh instead of reload
}

export default function ViewManager({ isOpen, onClose, editView, onSave }: ViewManagerProps) {
  const [name, setName] = useState(editView?.name || '');
  const [objective, setObjective] = useState(editView?.objective || '');
  const [isDefault, setIsDefault] = useState(editView?.is_default || false);
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Inicializar filtros cuando se abre para editar
  useEffect(() => {
    if (editView && editView.filters) {
      setSelectedFilterIds(editView.filters.map(f => f.id));
    } else {
      setSelectedFilterIds([]);
    }
  }, [editView, isOpen]);

  if (!isOpen) return null;

  async function handleSave() {
    if (!name) {
      alert('Por favor ingresa un nombre para la vista');
      return;
    }

    setSaving(true);
    try {
      const method = editView ? 'PUT' : 'POST';
      const url = editView ? `/api/views/${editView.id}` : '/api/views';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          objective,
          is_default: isDefault,
          filter_ids: selectedFilterIds,
        }),
      });

      if (!response.ok) {
        throw new Error('Falló al guardar la vista');
      }

      // Call onSave callback or reload
      if (onSave) {
        onSave();
      } else {
        window.location.reload();
      }

      onClose();
    } catch (error) {
      alert('Error al guardar la vista: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    } finally {
      setSaving(false);
    }
  }

  function handleSelectFilter(filterId: string) {
    setSelectedFilterIds([...selectedFilterIds, filterId]);
  }

  function handleDeselectFilter(filterId: string) {
    setSelectedFilterIds(selectedFilterIds.filter((id) => id !== filterId));
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            {editView ? 'Editar vista' : 'Crear nueva vista'}
          </h2>
          <button onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Detalles de la vista</h3>
            <div className={styles.formGrid}>
              <div>
                <label htmlFor="name" className={styles.label}>
                  Nombre de la vista *
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej.: Rendimiento de ventas Q4"
                  className={styles.input}
                />
              </div>

              <div>
                <label htmlFor="objective" className={styles.label}>
                  Objetivo
                </label>
                <textarea
                  id="objective"
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="¿Cuál es el objetivo de este tablero?"
                  rows={3}
                  className={styles.input}
                />
              </div>

              <div className={styles.checkboxContainer}>
                <input
                  id="isDefault"
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className={styles.checkbox}
                />
                <label htmlFor="isDefault" className={styles.checkboxLabel}>
                  Establecer como vista predeterminada
                </label>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Seleccionar filtros</h3>
            <p className={styles.sectionDescription}>
              Estos filtros se aplicarán a todos los gráficos de esta vista
            </p>
            <FilterSelector
              selectedFilterIds={selectedFilterIds}
              onSelect={handleSelectFilter}
              onDeselect={handleDeselectFilter}
            />
          </div>

          <div className={styles.note}>
            <strong>Nota:</strong> Después de crear la vista, puedes agregar gráficos desde la página de la vista.
          </div> 
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.secondaryButton}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className={styles.primaryButton}>
            {saving ? 'Guardando...' : editView ? 'Actualizar vista' : 'Crear vista'}
          </button>
        </div>
      </div>
    </div>
  );
}
