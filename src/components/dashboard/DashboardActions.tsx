'use client';

import styles from './DashboardActions.module.css';

interface DashboardActionsProps {
  onCreateChart: () => void;
  onManageView: () => void;
  onManageFilters: () => void;
}

export default function DashboardActions({
  onCreateChart,
  onManageView,
  onManageFilters,
}: DashboardActionsProps) {
  return (
    <div className={styles.dashboardActions}>
      <button onClick={onCreateChart} className={styles.actionButton}>
        + Create Chart
      </button>
      <button onClick={onManageView} className={styles.actionButton}>
        Manage View
      </button>
      <button onClick={onManageFilters} className={styles.actionButton}>
        Manage Filters
      </button>
    </div>
  );
}
