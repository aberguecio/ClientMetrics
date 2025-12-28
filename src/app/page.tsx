import JobProcessor from '@/components/jobs/JobProcessor';
import styles from "./page.module.css"

export default function Home() {
  return (
    <div className="container">
      <h1>Dashboard de Métricas</h1>

      <JobProcessor />

      <div className={styles.card}>
        <p className={styles.description}>
          Bienvenido a Client Metrics. La aplicación está configurada y lista para usar.
        </p>
        <div className={styles.checkList}>
          <p className={styles.checkItem}>✓ Docker Compose configurado</p>
          <p className={styles.checkItem}>✓ PostgreSQL con pgvector</p>
          <p className={styles.checkItem}>✓ Next.js 14 con App Router</p>
          <p className={styles.checkItem}>✓ CSS vanilla (sin Tailwind)</p>
          <p className={styles.checkItem}>✓ OpenAI LLM + Embeddings</p>
          <p className={styles.checkItem}>✓ Sistema de procesamiento de jobs</p>
        </div>
      </div>
    </div>
  )
}
