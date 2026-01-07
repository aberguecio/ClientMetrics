import UploadForm from '@/components/upload/UploadForm';
import JobProcessor from '@/components/jobs/JobProcessor';
import styles from './upload.module.css';

export default function UploadPage() {
  return (
    <div className="container">
      <h1>Subir Archivo CSV</h1>

      <div className={styles.uploadContainer}>
        <div className={styles.block}>
          <h2 className={styles.blockTitle}>Instrucciones</h2>
          <ul className={styles.instructionsList}>
            <li>El archivo debe ser un CSV con las siguientes columnas:</li>
            <li className={styles.columnList}>
              <code>Nombre</code>, <code>Correo Electronico</code>, <code>Numero de Telefono</code>,
              <code>Fecha de la Reunion</code> (YYYY-MM-DD), <code>Vendedor asignado</code>,
              <code>closed</code> (0 o 1), <code>Transcripcion</code>
            </li>
            <li>Tamaño máximo: 10MB</li>
            <li>Las reuniones se importarán automáticamente a la base de datos</li>
          </ul>
        </div>

        <UploadForm />

        {/* JobProcessor para monitorear el progreso de los jobs */}
        <JobProcessor />
      </div>
    </div>
  );
}
