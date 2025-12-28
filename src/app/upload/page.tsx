import UploadForm from '@/components/upload/UploadForm';
import styles from './upload.module.css';

export default function UploadPage() {
  return (
    <div className="container">
      <h1>Subir Archivo CSV</h1>

      <div className={styles.uploadContainer}>
        <div className={styles.instructions}>
          <h2>Instrucciones</h2>
          <ul>
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
      </div>
    </div>
  );
}
