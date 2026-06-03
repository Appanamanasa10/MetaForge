import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { id, applicationId, name, schemaJson } = body;

    if (!applicationId || !name || !schemaJson) {
      return NextResponse.json(
        { success: false, message: 'Missing required parameters: applicationId, name, schemaJson' },
        { status: 400 }
      );
    }

    // Verify application ownership
    const app = await db.application.findFirst({
      where: { id: applicationId, ownerId: userId },
    });
    if (!app) {
      return NextResponse.json(
        { success: false, message: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    let entity;
    if (id) {
      entity = await db.entity.update({
        where: { id },
        data: {
          name: name.trim(),
          schemaJson,
        },
      });
    } else {
      entity = await db.entity.create({
        data: {
          applicationId,
          name: name.trim(),
          schemaJson,
        },
      });
    }

    return NextResponse.json({ success: true, data: entity });
  } catch (error: any) {
    console.error('[ENTITIES_POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save entity schema' },
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
      return NextResponse.json({ success: false, message: 'Entity ID is required' }, { status: 400 });
    }

    // Verify ownership via application relationship
    const entity = await db.entity.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!entity || entity.application.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Entity not found or unauthorized' },
        { status: 404 }
      );
    }

    await db.entity.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Entity deleted successfully' });
  } catch (error: any) {
    console.error('[ENTITIES_DELETE]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete entity schema' },
      { status: 500 }
    );
  }
}
