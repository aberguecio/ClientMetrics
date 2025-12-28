import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { uploads, salesMeetings } from '@/lib/db/schema';
import { parseCSV, isValidCSVFile, isValidFileSize } from '@/lib/csv/parser';
import { validateCSVData } from '@/lib/csv/validator';
import { createJobs } from '@/lib/jobs/processor';

export async function POST(request: NextRequest) {
  try {
    // 1. Extract file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // 2. Validate file type
    if (!isValidCSVFile(file.name)) {
      return NextResponse.json(
        { success: false, error: 'El archivo debe ser un CSV' },
        { status: 400 }
      );
    }

    // 3. Validate file size (max 10MB)
    if (!isValidFileSize(file.size)) {
      return NextResponse.json(
        { success: false, error: 'El archivo excede el tamaño máximo de 10MB' },
        { status: 400 }
      );
    }

    // 4. Convert to buffer and parse
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let parsedData;
    try {
      parsedData = parseCSV(buffer);
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : 'Error al parsear el CSV',
        },
        { status: 400 }
      );
    }

    // 5. Validate data
    const validation = validateCSVData(parsedData.data);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Errores de validación en el CSV',
          validationErrors: validation.errors,
        },
        { status: 400 }
      );
    }

    // 6. Insert into database (transaction)
    const result = await db.transaction(async (tx) => {
      // Create upload record
      const [upload] = await tx
        .insert(uploads)
        .values({
          filename: file.name,
          uploadedBy: 'anonymous', // TODO: Add authentication
          rowCount: parsedData.rowCount,
        })
        .returning();

      // Prepare data for insertion
      const meetingsData = validation.data!.map((row) => ({
        clientName: row['Nombre'],
        email: row['Correo Electronico'],
        phone: row['Numero de Telefono'],
        meetingDate: row['Fecha de la Reunion'],
        salesRep: row['Vendedor asignado'],
        closed: row['closed'] === '1',
        transcript: row['Transcripcion'],
        uploadId: upload.id,
      }));

      // Insert meetings (batch insert)
      const insertedMeetings = await tx
        .insert(salesMeetings)
        .values(meetingsData)
        .returning();

      return { upload, meetings: insertedMeetings };
    });

    // 7. Create processing jobs for LLM analysis
    const meetingIds = result.meetings.map((m: { id: string }) => m.id);
    await createJobs(meetingIds);

    console.log(`Created ${meetingIds.length} processing jobs for upload ${result.upload.id}`);

    // Note: Jobs will be processed automatically by the auto-processor running in the background
    // No need to trigger processing manually - the auto-processor checks for pending jobs every 10 seconds

    return NextResponse.json({
      success: true,
      uploadId: result.upload.id,
      rowCount: parsedData.rowCount,
      jobsCreated: meetingIds.length,
      message: `Se importaron ${parsedData.rowCount} reuniones exitosamente. El procesamiento de IA se iniciará automáticamente.`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
