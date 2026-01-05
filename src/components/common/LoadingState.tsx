'use client';

import styles from './LoadingState.module.css';

/**
 * Consistent loading state component with spinner
 *
 * @param message - Optional loading message text (default: "Loading...")
 * @param size - Spinner size: 'small' | 'medium' | 'large' (default: 'medium')
 * @param fullPage - Whether to render as full-page overlay (default: false)
 */
export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullPage?: boolean;
}

export default function LoadingState({
  message = 'Loading...',
  size = 'medium',
  fullPage = false
}: LoadingStateProps) {
  const containerClass = fullPage
    ? `${styles.container} ${styles.fullPage}`
    : styles.container;

  return (
    <div className={containerClass}>
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      <p className={styles.message}>{message}</p>
    </div>
  );
}
