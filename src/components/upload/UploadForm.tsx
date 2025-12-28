'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './UploadForm.module.css';

export default function UploadForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;
    setFile(selectedFile);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Error al subir el archivo');
        if (data.validationErrors) {
          console.error('Errores de validación:', data.validationErrors);
        }
      } else {
        setResult(data);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      setError('Error de conexión al servidor');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleViewMeetings = () => {
    router.push('/meetings');
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="file-input" className={styles.label}>
            Seleccionar archivo CSV
          </label>
          <input
            id="file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className={styles.fileInput}
            disabled={uploading}
          />
          {file && (
            <p className={styles.fileName}>
              Archivo seleccionado: <strong>{file.name}</strong> ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className={styles.submitButton}
        >
          {uploading ? 'Subiendo...' : 'Subir CSV'}
        </button>
      </form>

      {error && (
        <div className={styles.error}>
          <h3>Error</h3>
          <p>{error}</p>
        </div>
      )}

      {result && result.success && (
        <div className={styles.success}>
          <h3>¡Éxito!</h3>
          <p>{result.message}</p>
          <div className={styles.resultDetails}>
            <p>Upload ID: <code>{result.uploadId}</code></p>
            <p>Reuniones importadas: <strong>{result.rowCount}</strong></p>
          </div>
          <button onClick={handleViewMeetings} className={styles.viewButton}>
            Ver Reuniones
          </button>
        </div>
      )}
    </div>
  );
}
