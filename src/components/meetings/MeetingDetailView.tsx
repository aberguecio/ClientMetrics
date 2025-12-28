'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { MeetingDetail } from '@/types/api';
import styles from './MeetingDetailView.module.css';

interface MeetingDetailViewProps {
  meeting: MeetingDetail;
}

export default function MeetingDetailView({ meeting }: MeetingDetailViewProps) {
  const analysis = meeting.llm_analysis?.analysisJson;

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <Link href="/meetings" className={styles.backLink}>
            ← Volver a reuniones
          </Link>
          <h1 className={styles.title}>{meeting.clientName}</h1>
        </div>
        <span
          className={`${styles.statusBadge} ${
            meeting.closed ? styles.closed : styles.open
          }`}
        >
          {meeting.closed ? 'Cerrada' : 'Abierta'}
        </span>
      </div>

      {/* Grid de información básica */}
      <div className={styles.infoGrid}>
        <div className={styles.infoCard}>
          <label>Email</label>
          <p>{meeting.email}</p>
        </div>
        <div className={styles.infoCard}>
          <label>Teléfono</label>
          <p>{meeting.phone}</p>
        </div>
        <div className={styles.infoCard}>
          <label>Vendedor</label>
          <p>{meeting.salesRep}</p>
        </div>
        <div className={styles.infoCard}>
          <label>Fecha</label>
          <p>{formatDate(meeting.meetingDate)}</p>
        </div>
      </div>

      {/* Análisis LLM */}
      {analysis ? (
        <div className={styles.analysisSection}>
          <h2>Análisis de IA</h2>

          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <label>Sector</label>
              <p className={styles.metricValue}>{analysis.sector || 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Nivel de Interés</label>
              <p className={styles.metricValue}>{analysis.interest_level || 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Sentimiento</label>
              <p className={styles.metricValue}>{analysis.sentiment || 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Urgencia</label>
              <p className={styles.metricValue}>{analysis.urgency || 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>ICP Fit</label>
              <p className={styles.metricValue}>{analysis.icp_fit || 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Confianza</label>
              <p className={styles.metricValue}>{analysis.confidence ? `${(analysis.confidence * 100).toFixed(0)}%` : 'N/A'}</p>
            </div>
          </div>

          {/* Detalles */}
          <div className={styles.detailsGrid}>
            {analysis.pain_points && analysis.pain_points.length > 0 && (
              <div className={styles.detailCard}>
                <h3>Pain Points</h3>
                <ul>
                  {analysis.pain_points.map((point, index) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.use_cases && analysis.use_cases.length > 0 && (
              <div className={styles.detailCard}>
                <h3>Casos de Uso</h3>
                <ul>
                  {analysis.use_cases.map((useCase, index) => (
                    <li key={index}>{useCase}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.objections && analysis.objections.length > 0 && (
              <div className={styles.detailCard}>
                <h3>Objeciones</h3>
                <ul>
                  {analysis.objections.map((objection, index) => (
                    <li key={index}>{objection}</li>
                  ))}
                </ul>
              </div>
            )}

            {analysis.others && (
              <div className={styles.detailCard}>
                <h3>Otros Comentarios</h3>
                <p>{analysis.others}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.noAnalysis}>
          <p>Esta reunión aún no ha sido analizada por IA</p>
        </div>
      )}

      {/* Transcripción */}
      <div className={styles.transcriptSection}>
        <h2>Transcripción</h2>
        <div className={styles.transcript}>
          <p>{meeting.transcript}</p>
        </div>
      </div>
    </div>
  );
}
