import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;
    
    const applications = await db.application.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        entities: {
          select: { id: true, name: true, schemaJson: true }
        }
      }
    });
    
    return NextResponse.json({ success: true, data: applications });
  } catch (error: any) {
    console.error('[APPLICATIONS_GET]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch applications' },
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
    const { name, description } = body;
    
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'Application name is required' },
        { status: 400 }
      );
    }

    const application = await db.application.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        ownerId: userId,
      },
    });

    return NextResponse.json({ success: true, data: application });
  } catch (error: any) {
    console.error('[APPLICATIONS_POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to create application' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { id, name, description } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'Application ID is required' }, { status: 400 });
    }
    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, message: 'Application name is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.application.findUnique({ where: { id } });
    if (!existing || existing.ownerId !== userId) {
      return NextResponse.json({ success: false, message: 'Application not found or unauthorized' }, { status: 404 });
    }

    const updated = await db.application.update({
      where: { id },
      data: {
        name: name.trim(),
        description: description?.trim() ?? existing.description,
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('[APPLICATIONS_PATCH]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update application' },
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
      return NextResponse.json({ success: false, message: 'Application ID is required' }, { status: 400 });
    }

    // Verify ownership
    const existing = await db.application.findUnique({
      where: { id },
      include: { entities: { include: { records: true } } },
    });
    if (!existing || existing.ownerId !== userId) {
      return NextResponse.json({ success: false, message: 'Application not found or unauthorized' }, { status: 404 });
    }

    // Cascade delete: records → entities → application
    for (const entity of existing.entities) {
      await db.record.deleteMany({ where: { entityId: entity.id } });
    }
    await db.entity.deleteMany({ where: { applicationId: id } });
    await db.application.delete({ where: { id } });

    return NextResponse.json({ success: true, message: 'Application deleted successfully' });
  } catch (error: any) {
    console.error('[APPLICATIONS_DELETE]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete application' },
      { status: 500 }
    );
  }
}
