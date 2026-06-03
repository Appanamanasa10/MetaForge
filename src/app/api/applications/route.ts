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
