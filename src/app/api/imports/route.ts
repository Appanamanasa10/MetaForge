import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { triggerWorkflows } from '@/features/workflows/workflow-engine';
import { z } from 'zod';
import { FieldDefinition } from '@/types';

function validateRow(fields: FieldDefinition[], data: any) {
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
        validator = z.coerce.boolean({
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { entityId, records } = body;

    if (!entityId || !Array.isArray(records)) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters: entityId, records (array)' },
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

    const schemaObj = entity.schemaJson as any;
    const fields = schemaObj.fields || [];

    // Fetch existing records to check for duplicates
    const existingRecords = await db.record.findMany({
      where: { entityId },
    });
    const existingDataArray = existingRecords.map((r) => r.dataJson as Record<string, any>);

    const successRecords: any[] = [];
    const failedRows: { rowNumber: number; data: any; errors: Record<string, string[]> }[] = [];
    const duplicateRows: { rowNumber: number; data: any }[] = [];

    records.forEach((rawRow, index) => {
      const rowNumber = index + 1;

      // 1. Check for duplicates (completely identical row or matching key values like 'email' if present)
      const isDuplicate = existingDataArray.some((existing) => {
        // If there's an email field, match on email
        if (rawRow.email && existing.email) {
          return String(rawRow.email).trim().toLowerCase() === String(existing.email).trim().toLowerCase();
        }
        // Otherwise check if all fields match
        return Object.keys(rawRow).every((k) => String(rawRow[k]) === String(existing[k]));
      });

      if (isDuplicate) {
        duplicateRows.push({ rowNumber, data: rawRow });
        return;
      }

      // 2. Validate row structure
      const valResult = validateRow(fields, rawRow);

      if (!valResult.success) {
        const formattedErrors: Record<string, string[]> = {};
        valResult.error.errors.forEach((err) => {
          const path = err.path.join('.');
          if (!formattedErrors[path]) formattedErrors[path] = [];
          formattedErrors[path].push(err.message);
        });

        failedRows.push({
          rowNumber,
          data: rawRow,
          errors: formattedErrors,
        });
      } else {
        successRecords.push(valResult.data);
      }
    });

    // 3. Batch insert using transaction
    if (successRecords.length > 0) {
      await db.$transaction(
        successRecords.map((data) =>
          db.record.create({
            data: {
              entityId,
              dataJson: data,
            },
          })
        )
      );

      // Trigger workflows for each imported row (non-blocking)
      successRecords.forEach((data) => {
        triggerWorkflows(entity.applicationId, entityId, 'RECORD_CREATED', data);
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalProcessed: records.length,
        importedCount: successRecords.length,
        failedCount: failedRows.length,
        duplicateCount: duplicateRows.length,
      },
      failures: failedRows,
      duplicates: duplicateRows,
    });
  } catch (error: any) {
    console.error('[IMPORTS_POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to import CSV' },
      { status: 500 }
    );
  }
}
