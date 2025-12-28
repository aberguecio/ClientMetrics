import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { salesMeetings, llmAnalysis } from '@/lib/db/schema';
import { eq, desc, and, sql, inArray } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const salesRep = searchParams.get('salesRep');
    const closed = searchParams.get('closed');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 50;

    // Construir query con filtros
    let query = db
      .select({
        id: salesMeetings.id,
        clientName: salesMeetings.clientName,
        email: salesMeetings.email,
        phone: salesMeetings.phone,
        meetingDate: salesMeetings.meetingDate,
        salesRep: salesMeetings.salesRep,
        closed: salesMeetings.closed,
        transcript: salesMeetings.transcript,
        createdAt: salesMeetings.createdAt,
        updatedAt: salesMeetings.updatedAt,
        analysis: llmAnalysis.analysisJson,
      })
      .from(salesMeetings)
      .leftJoin(llmAnalysis, eq(salesMeetings.id, llmAnalysis.meetingId))
      .$dynamic();

    // Aplicar filtros
    const conditions = [];

    if (salesRep && salesRep !== 'all') {
      conditions.push(eq(salesMeetings.salesRep, salesRep));
    }

    if (closed === 'true') {
      conditions.push(eq(salesMeetings.closed, true));
    } else if (closed === 'false') {
      conditions.push(eq(salesMeetings.closed, false));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Aplicar paginación y ordenamiento
    const meetings = await query
      .orderBy(desc(salesMeetings.meetingDate))
      .limit(limit)
      .offset((page - 1) * limit);

    // Contar total para paginación
    let countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(salesMeetings)
      .$dynamic();

    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions));
    }

    const [{ count: total }] = await countQuery;

    return NextResponse.json({
      meetings,
      page,
      limit,
      total: Number(total),
      totalPages: Math.ceil(Number(total) / limit),
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al obtener las reuniones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Se requiere un array de IDs',
        },
        { status: 400 }
      );
    }

    // Validate max 100 IDs
    if (ids.length > 100) {
      return NextResponse.json(
        {
          success: false,
          error: 'Máximo 100 reuniones por operación',
        },
        { status: 400 }
      );
    }

    // Delete llm_analysis first (foreign key constraint)
    await db.delete(llmAnalysis).where(inArray(llmAnalysis.meetingId, ids));

    // Delete meetings
    await db.delete(salesMeetings).where(inArray(salesMeetings.id, ids));

    return NextResponse.json({
      success: true,
      deleted: ids.length,
    });
  } catch (error) {
    console.error('Error deleting meetings:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Error al eliminar las reuniones',
        details: error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
