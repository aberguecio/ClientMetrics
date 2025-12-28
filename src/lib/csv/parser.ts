import { parse } from 'csv-parse/sync';

export interface ParsedCSV {
  data: any[];
  rowCount: number;
}

/**
 * Parse CSV buffer to array of objects
 */
export function parseCSV(buffer: Buffer): ParsedCSV {
  try {
    const content = buffer.toString('utf-8');

    const records = parse(content, {
      columns: true, // Use first row as headers
      skip_empty_lines: true,
      trim: true,
      bom: true, // Handle BOM if present
    });

    return {
      data: records,
      rowCount: records.length,
    };
  } catch (error) {
    throw new Error(`Error al parsear CSV: ${error instanceof Error ? error.message : 'Error desconocido'}`);
  }
}

/**
 * Validate file is CSV
 */
export function isValidCSVFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.csv');
}

/**
 * Validate file size (max 10MB)
 */
export function isValidFileSize(size: number, maxSizeMB: number = 10): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return size <= maxBytes;
}
