import { z } from 'zod';

// Validation schema for each CSV row
const MeetingRowSchema = z.object({
  'Nombre': z.string().min(1, 'El nombre es requerido'),
  'Correo Electronico': z.string().email('Email inválido'),
  'Numero de Telefono': z.string().min(1, 'El teléfono es requerido'),
  'Fecha de la Reunion': z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha debe ser YYYY-MM-DD'),
  'Vendedor asignado': z.string().min(1, 'El vendedor es requerido'),
  'closed': z.enum(['0', '1'], { errorMap: () => ({ message: 'closed debe ser 0 o 1' }) }),
  'Transcripcion': z.string().min(10, 'La transcripción debe tener al menos 10 caracteres'),
});

export type MeetingRow = z.infer<typeof MeetingRowSchema>;

export interface ValidationResult {
  valid: boolean;
  data?: MeetingRow[];
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
  }>;
}

/**
 * Validates an array of CSV rows
 */
export function validateCSVData(rows: any[]): ValidationResult {
  const errors: Array<{ row: number; field?: string; message: string }> = [];
  const validData: MeetingRow[] = [];

  rows.forEach((row, index) => {
    try {
      const validated = MeetingRowSchema.parse(row);
      validData.push(validated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach(err => {
          errors.push({
            row: index + 2, // +2 because: +1 for 1-based index, +1 for header row
            field: err.path.join('.'),
            message: err.message,
          });
        });
      } else {
        errors.push({
          row: index + 2,
          message: 'Error desconocido al validar la fila',
        });
      }
    }
  });

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, data: validData };
}
