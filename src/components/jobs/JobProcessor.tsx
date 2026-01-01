'use client';

import { useState, useEffect } from 'react';
import styles from './JobProcessor.module.css';

interface JobStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

export default function JobProcessor() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/process-jobs');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh stats every 5 seconds to show real-time progress
  useEffect(() => {
    fetchStats();

    const interval = setInterval(() => {
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Cargando estadísticas...</div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const totalJobs = stats.pending + stats.processing + stats.completed + stats.failed;
  const progress = totalJobs > 0 ? Math.round((stats.completed / totalJobs) * 100) : 0;
  const isProcessing = stats.pending > 0 || stats.processing > 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>Procesamiento de IA</h3>
        <p className={styles.subtitle}>Actualización automática cada 5 segundos</p>
      </div>

      {isProcessing && (
        <div className={styles.processingIndicator}>
          <span className={styles.pulse}></span>
          Procesando automáticamente en segundo plano...
        </div>
      )}

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>Pendientes</span>
          <span className={`${styles.statValue} ${styles.pending}`}>
            {stats.pending}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Procesando</span>
          <span className={`${styles.statValue} ${styles.processing}`}>
            {stats.processing}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Completados</span>
          <span className={`${styles.statValue} ${styles.completed}`}>
            {stats.completed}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>Fallidos</span>
          <span className={`${styles.statValue} ${styles.failed}`}>
            {stats.failed}
          </span>
        </div>
      </div>

      {totalJobs > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className={styles.progressText}>
            {progress}% completado ({stats.completed} de {totalJobs})
          </p>
        </div>
      )}

      <div className={styles.info}>
        <p>Los trabajos se procesan automáticamente en segundo plano. No se requiere acción manual.</p>
      </div>

      {stats.failed > 0 && (
        <div className={styles.actions}>
          <button
            onClick={async () => {
              if (!confirm('¿Estás seguro de que quieres reintentar todos los trabajos fallidos?')) return;

              try {
                setLoading(true);
                const res = await fetch('/api/jobs/retry-failed', { method: 'POST' });
                const data = await res.json();
                if (data.success) {
                  alert(data.message);
                  fetchStats();
                } else {
                  alert('Error: ' + data.error);
                }
              } catch (e) {
                alert('Error de conexión');
              } finally {
                setLoading(false);
              }
            }}
            className={styles.retryButton}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: 500,
              width: '100%'
            }}
          >
            🔄 Reintentar todos los fallidos ({stats.failed})
          </button>
        </div>
      )}
    </div>
  );
}
