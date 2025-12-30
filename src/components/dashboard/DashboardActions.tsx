'use client';

import { useState } from 'react';
import styles from './DashboardActions.module.css';

interface DashboardActionsProps {
  onCreateChart: () => void;
  onCreateView: () => void;
  onEditView: () => void;
  onDeleteView: () => void;
  onManageFilters: () => void;
  hasActiveView: boolean;
}

export default function DashboardActions({
  onCreateChart,
  onCreateView,
  onEditView,
  onDeleteView,
  onManageFilters,
  hasActiveView,
}: DashboardActionsProps) {
  const [showViewMenu, setShowViewMenu] = useState(false);

  return (
    <div className={styles.dashboardActions}>
      <button onClick={onCreateChart} className={styles.actionButton}>
        + Create Chart
      </button>

      <div className={styles.menuContainer}>
        <button
          onClick={() => setShowViewMenu(!showViewMenu)}
          className={styles.actionButton}
        >
          Manage View ▾
        </button>
        {showViewMenu && (
          <div className={styles.dropdownMenu}>
            <button onClick={() => { onCreateView(); setShowViewMenu(false); }}>
              + Create New View
            </button>
            {hasActiveView && (
              <>
                <button onClick={() => { onEditView(); setShowViewMenu(false); }}>
                  ✎ Edit Current View
                </button>
                <button
                  onClick={() => { onDeleteView(); setShowViewMenu(false); }}
                  className={styles.dangerButton}
                >
                  🗑 Delete Current View
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <button onClick={onManageFilters} className={styles.actionButton}>
        Manage Filters
      </button>
    </div>
  );
}
