import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { triggerWorkflows } from '@/features/workflows/workflow-engine';
import { z } from 'zod';
import { FieldDefinition } from '@/types';

// Dynamic backend validator
function validateRecord(fields: FieldDefinition[], data: any) {
  const shape: Record<string, z.ZodTypeAny> = {};

  fields.forEach((field) => {
    let validator: z.ZodTypeAny;

    switch (field.type) {
      case 'number':
        validator = z.coerce.number({
          invalid_type_error: `${field.name} must be a number`,
        });
        break;
      case 'email':
        validator = z.string().email(`${field.name} must be a valid email`);
        break;
      case 'checkbox':
        validator = z.boolean({
          invalid_type_error: `${field.name} must be a checkbox boolean`,
        });
        break;
      case 'date':
        validator = z.string().refine((val) => !isNaN(Date.parse(val)), {
          message: `${field.name} must be a valid date string`,
        });
        break;
      case 'text':
      case 'textarea':
      case 'select':
      default:
        validator = z.string({
          invalid_type_error: `${field.name} must be a string`,
        });
        break;
    }

    if (field.required) {
      if (field.type !== 'checkbox' && field.type !== 'number') {
        validator = (validator as z.ZodString).min(1, `${field.name} is required`);
      }
    } else {
      validator = validator.optional().nullable();
    }

    shape[field.name] = validator;
  });

  const schema = z.object(shape);
  return schema.safeParse(data);
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const search = searchParams.get('search') || '';

    if (!entityId) {
      return NextResponse.json(
        { success: false, message: 'Entity ID is required' },
        { status: 400 }
      );
    }

    // Verify entity owner
    const entity = await db.entity.findUnique({
      where: { id: entityId },
      include: { application: true },
    });

    if (!entity || entity.application.ownerId !== (session.user as any).id) {
      return NextResponse.json(
        { success: false, message: 'Entity not found or unauthorized' },
        { status: 404 }
      );
    }

    // Fetch records
    const allRecords = await db.record.findMany({
      where: { entityId },
      orderBy: { createdAt: 'desc' },
    });

    // Parse dataJson and filter client-side for safety/flexibility across databases
    let records = allRecords.map((r) => ({
      id: r.id,
      entityId: r.entityId,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      data: r.dataJson as Record<string, any>,
    }));

    if (search.trim() !== '') {
      const searchLower = search.toLowerCase();
      records = records.filter((r) => {
        return Object.values(r.data).some((val) =>
          String(val).toLowerCase().includes(searchLower)
        );
      });
    }

    const total = records.length;
    const startIndex = (page - 1) * limit;
    const paginatedRecords = records.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedRecords,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('[RECORDS_GET]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch records' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { entityId, data } = body;

    if (!entityId || !data) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters: entityId, data' },
        { status: 400 }
      );
    }

    const entity = await db.entity.findUnique({
      where: { id: entityId },
      include: { application: true },
    });

    if (!entity || entity.application.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Entity not found or unauthorized' },
        { status: 404 }
      );
    }

    // Dynamic schema validation
    const schemaObj = entity.schemaJson as any;
    const fields = schemaObj.fields || [];

    const validationResult = validateRecord(fields, data);
    if (!validationResult.success) {
      const formattedErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formattedErrors[path]) formattedErrors[path] = [];
        formattedErrors[path].push(err.message);
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Validation Failed',
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Save record
    const record = await db.record.create({
      data: {
        entityId,
        dataJson: validationResult.data,
      },
    });

    // Execute workflows asynchronously
    triggerWorkflows(entity.applicationId, entityId, 'RECORD_CREATED', validationResult.data);

    return NextResponse.json({
      success: true,
      data: {
        id: record.id,
        entityId: record.entityId,
        createdAt: record.createdAt,
        data: record.dataJson,
      },
    });
  } catch (error: any) {
    console.error('[RECORDS_POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create record' },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { id, entityId, data } = body;

    if (!id || !entityId || !data) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters: id, entityId, data' },
        { status: 400 }
      );
    }

    const entity = await db.entity.findUnique({
      where: { id: entityId },
      include: { application: true },
    });

    if (!entity || entity.application.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Entity not found or unauthorized' },
        { status: 404 }
      );
    }

    const originalRecord = await db.record.findUnique({
      where: { id },
    });

    if (!originalRecord || originalRecord.entityId !== entityId) {
      return NextResponse.json({ success: false, message: 'Record not found' }, { status: 404 });
    }

    // Dynamic schema validation
    const schemaObj = entity.schemaJson as any;
    const fields = schemaObj.fields || [];

    const validationResult = validateRecord(fields, data);
    if (!validationResult.success) {
      const formattedErrors: Record<string, string[]> = {};
      validationResult.error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!formattedErrors[path]) formattedErrors[path] = [];
        formattedErrors[path].push(err.message);
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Validation Failed',
          errors: formattedErrors,
        },
        { status: 400 }
      );
    }

    // Update record
    const updatedRecord = await db.record.update({
      where: { id },
      data: {
        dataJson: validationResult.data,
      },
    });

    // Execute workflows asynchronously
    triggerWorkflows(entity.applicationId, entityId, 'RECORD_UPDATED', validationResult.data);

    return NextResponse.json({
      success: true,
      data: {
        id: updatedRecord.id,
        entityId: updatedRecord.entityId,
        createdAt: updatedRecord.createdAt,
        updatedAt: updatedRecord.updatedAt,
        data: updatedRecord.dataJson,
      },
    });
  } catch (error: any) {
    console.error('[RECORDS_PUT]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update record' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'Record ID is required' }, { status: 400 });
    }

    const record = await db.record.findUnique({
      where: { id },
      include: {
        entity: {
          include: { application: true },
        },
      },
    });

    if (!record || record.entity.application.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Record not found or unauthorized' },
        { status: 404 }
      );
    }

    await db.record.delete({
      where: { id },
    });

    // Execute workflows asynchronously
    triggerWorkflows(
      record.entity.applicationId,
      record.entityId,
      'RECORD_DELETED',
      record.dataJson as Record<string, any>
    );

    return NextResponse.json({ success: true, message: 'Record deleted successfully' });
  } catch (error: any) {
    console.error('[RECORDS_DELETE]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete record' },
      { status: 500 }
    );
  }
}
