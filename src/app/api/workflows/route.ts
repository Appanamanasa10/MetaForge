import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const { searchParams } = new URL(req.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json(
        { success: false, message: 'Application ID is required' },
        { status: 400 }
      );
    }

    // Verify application owner
    const app = await db.application.findFirst({
      where: { id: applicationId, ownerId: userId },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, message: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    const workflows = await db.workflow.findMany({
      where: { applicationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: workflows });
  } catch (error: any) {
    console.error('[WORKFLOWS_GET]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch workflows' },
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
    const { id, applicationId, triggerType, actionType, configurationJson } = body;

    if (!applicationId || !triggerType || !actionType || !configurationJson) {
      return NextResponse.json(
        { success: false, message: 'Missing parameters: applicationId, triggerType, actionType, configurationJson' },
        { status: 400 }
      );
    }

    // Verify application owner
    const app = await db.application.findFirst({
      where: { id: applicationId, ownerId: userId },
    });

    if (!app) {
      return NextResponse.json(
        { success: false, message: 'Application not found or unauthorized' },
        { status: 404 }
      );
    }

    let workflow;
    if (id) {
      workflow = await db.workflow.update({
        where: { id },
        data: {
          triggerType,
          actionType,
          configurationJson,
        },
      });
    } else {
      workflow = await db.workflow.create({
        data: {
          applicationId,
          triggerType,
          actionType,
          configurationJson,
        },
      });
    }

    return NextResponse.json({ success: true, data: workflow });
  } catch (error: any) {
    console.error('[WORKFLOWS_POST]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to save workflow' },
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
      return NextResponse.json({ success: false, message: 'Workflow ID is required' }, { status: 400 });
    }

    const workflow = await db.workflow.findUnique({
      where: { id },
      include: { application: true },
    });

    if (!workflow || workflow.application.ownerId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Workflow not found or unauthorized' },
        { status: 404 }
      );
    }

    await db.workflow.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error: any) {
    console.error('[WORKFLOWS_DELETE]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
