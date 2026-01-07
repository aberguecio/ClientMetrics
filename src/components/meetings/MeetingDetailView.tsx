'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import type { MeetingDetail } from '@/types/api';
import styles from './MeetingDetailView.module.css';
import {
  SECTOR_LABELS,
  COMPANY_SIZE_LABELS,
  DISCOVERY_CHANNEL_LABELS,
  PERSONALIZATION_LABELS,
  INTEGRATION_LABELS,
  DEMAND_PEAK_LABELS,
  QUERY_TYPE_LABELS,
  TOOL_LABELS,
} from '@/lib/constants/llm-enums';

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
          {meeting.closed ? 'Cerrada' : 'Fallida'}
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

          {/* Información del Negocio */}
          <h3>Información del Negocio</h3>
          <div className={styles.metricsGrid}>
            <div className={styles.metricCard}>
              <label>Sector</label>
              <p className={styles.metricValue}>{analysis.sector ? SECTOR_LABELS[analysis.sector as keyof typeof SECTOR_LABELS] || analysis.sector : 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Tamaño Empresa</label>
              <p className={styles.metricValue}>{analysis.company_size ? COMPANY_SIZE_LABELS[analysis.company_size as keyof typeof COMPANY_SIZE_LABELS] || analysis.company_size : 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Canal de Descubrimiento</label>
              <p className={styles.metricValue}>{analysis.discovery_channel ? DISCOVERY_CHANNEL_LABELS[analysis.discovery_channel as keyof typeof DISCOVERY_CHANNEL_LABELS] || analysis.discovery_channel : 'N/A'}</p>
            </div>
            <div className={styles.metricCard}>
              <label>Volumen de Interacciones Diarias</label>
              <p className={styles.metricValue}>{analysis.interaction_volume_daily || 'N/A'}</p>
            </div>
          </div>

          {/* Requerimientos Técnicos */}
          {analysis.requirements && (
            <>
              <h3 style={{ marginTop: '2rem' }}>Requerimientos Técnicos</h3>
              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <label>Confidencialidad</label>
                  <p className={styles.metricValue}>{analysis.requirements.confidentiality ? '✓ Sí' : '✗ No'}</p>
                </div>
                <div className={styles.metricCard}>
                  <label>Multiidioma</label>
                  <p className={styles.metricValue}>{analysis.requirements.multilingual ? '✓ Sí' : '✗ No'}</p>
                </div>
                <div className={styles.metricCard}>
                  <label>Tiempo Real</label>
                  <p className={styles.metricValue}>{analysis.requirements.real_time ? '✓ Sí' : '✗ No'}</p>
                </div>
                <div className={styles.metricCard}>
                  <label>Confianza (Sector)</label>
                  <p className={styles.metricValue}>{analysis.confidence?.sector ? `${(analysis.confidence.sector * 100).toFixed(0)}%` : 'N/A'}</p>
                </div>
              </div>

              {/* Personalizaciones e Integraciones */}
              <div className={styles.detailsGrid} style={{ marginTop: '1rem' }}>
                {analysis.requirements.personalization && analysis.requirements.personalization.length > 0 && (
                  <div className={styles.detailCard}>
                    <h3>Tipos de Personalización</h3>
                    <ul>
                      {analysis.requirements.personalization.map((item, index) => (
                        <li key={index}>{PERSONALIZATION_LABELS[item as keyof typeof PERSONALIZATION_LABELS] || item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.requirements.integrations && analysis.requirements.integrations.length > 0 && (
                  <div className={styles.detailCard}>
                    <h3>Integraciones Requeridas</h3>
                    <ul>
                      {analysis.requirements.integrations.map((item, index) => (
                        <li key={index}>{INTEGRATION_LABELS[item as keyof typeof INTEGRATION_LABELS] || item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Patrones de Negocio */}
          {((analysis.demand_peaks && analysis.demand_peaks.length > 0) ||
            (analysis.query_types && analysis.query_types.length > 0) ||
            (analysis.tools_mentioned && analysis.tools_mentioned.length > 0)) && (
            <>
              <h3 style={{ marginTop: '2rem' }}>Patrones de Negocio</h3>
              <div className={styles.detailsGrid}>
                {analysis.demand_peaks && analysis.demand_peaks.length > 0 && (
                  <div className={styles.detailCard}>
                    <h3>Picos de Demanda</h3>
                    <ul>
                      {analysis.demand_peaks.map((item, index) => (
                        <li key={index}>{DEMAND_PEAK_LABELS[item as keyof typeof DEMAND_PEAK_LABELS] || item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.query_types && analysis.query_types.length > 0 && (
                  <div className={styles.detailCard}>
                    <h3>Tipos de Consultas</h3>
                    <ul>
                      {analysis.query_types.map((item, index) => (
                        <li key={index}>{QUERY_TYPE_LABELS[item as keyof typeof QUERY_TYPE_LABELS] || item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.tools_mentioned && analysis.tools_mentioned.length > 0 && (
                  <div className={styles.detailCard}>
                    <h3>Herramientas Mencionadas</h3>
                    <ul>
                      {analysis.tools_mentioned.map((item, index) => (
                        <li key={index}>{TOOL_LABELS[item as keyof typeof TOOL_LABELS] || item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Insights de la Conversación */}
          <h3 style={{ marginTop: '2rem' }}>Insights de la Conversación</h3>
          <div className={styles.detailsGrid}>
            {analysis.pain_points && analysis.pain_points.length > 0 && (
              <div className={styles.detailCard}>
                <h3>Puntos de dolor</h3>
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
