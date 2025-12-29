'use client';

import Link from 'next/link';
import type { SavedView } from '@/types/charts';
import styles from './ViewCard.module.css';

interface ViewCardProps {
  view: SavedView;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function ViewCard({ view, onEdit, onDelete }: ViewCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>
            <Link href={`/views/${view.id}`} className={styles.titleLink}>
              {view.name}
            </Link>
            {view.is_default && <span className={styles.badge}>Default</span>}
          </h3>
          {view.objective && <p className={styles.objective}>{view.objective}</p>}
        </div>
        <div className={styles.actions}>
          {onEdit && (
            <button onClick={onEdit} className={styles.actionButton} title="Edit view">
              ✏️
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className={styles.actionButton} title="Delete view">
              🗑️
            </button>
          )}
        </div>
      </div>

      <div className={styles.footer}>
        <span className={styles.date}>
          Created {new Date(view.created_at).toLocaleDateString()}
        </span>
        <Link href={`/views/${view.id}`} className={styles.viewLink}>
          View Dashboard →
        </Link>
      </div>
    </div>
  );
}
