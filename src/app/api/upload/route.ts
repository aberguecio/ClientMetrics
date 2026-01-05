import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { uploads, salesMeetings } from '@/lib/db/schema';
import { parseCSV, isValidCSVFile, isValidFileSize } from '@/lib/csv/parser';
import { validateCSVData } from '@/lib/csv/validator';
import { createJobs } from '@/lib/jobs/processor';
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api';

/**
 * POST /api/upload
 * Upload and process CSV file with sales meeting transcripts
 *
 * @param request.formData.file - CSV file (max 10MB)
 * @returns Success status with upload ID and job count
 * @throws {400} If file missing, invalid format, or validation fails
 * @throws {500} On database or processing error
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract file from FormData
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return validationErrorResponse('No file provided');
    }

    // 2. Validate file type
    if (!isValidCSVFile(file.name)) {
      return validationErrorResponse('File must be a CSV');
    }

    // 3. Validate file size (max 10MB)
    if (!isValidFileSize(file.size)) {
      return validationErrorResponse('File exceeds maximum size of 10MB');
    }

    // 4. Convert to buffer and parse
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    let parsedData;
    try {
      parsedData = parseCSV(buffer);
    } catch (error) {
      return validationErrorResponse(
        error instanceof Error ? error.message : 'Failed to parse CSV'
      );
    }

    // 5. Validate data
    const validation = validateCSVData(parsedData.data);
    if (!validation.valid) {
      return validationErrorResponse('CSV validation errors', validation.errors);
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
    // But we trigger it immediately for better UX
    const { triggerJobProcessing } = await import('@/lib/jobs/auto-processor');
    triggerJobProcessing();

    return successResponse({
      success: true,
      uploadId: result.upload.id,
      rowCount: parsedData.rowCount,
      jobsCreated: meetingIds.length,
      message: `Imported ${parsedData.rowCount} meetings successfully. AI processing will start automatically.`,
    }, 201);
  } catch (error) {
    console.error('[API /upload POST] Error:', error);
    return errorResponse('Failed to upload CSV', error instanceof Error ? error.message : undefined);
  }
}
