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

    const notifications = await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ success: true, data: notifications });
  } catch (error: any) {
    console.error('[NOTIFICATIONS_GET]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch notifications' },
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
    const { id, all } = body;

    if (all) {
      // Mark all as read
      await db.notification.updateMany({
        where: { userId, readStatus: false },
        data: { readStatus: true },
      });
      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Notification ID is required' },
        { status: 400 }
      );
    }

    // Verify notification belongs to the user
    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      return NextResponse.json(
        { success: false, message: 'Notification not found or unauthorized' },
        { status: 404 }
      );
    }

    await db.notification.update({
      where: { id },
      data: { readStatus: true },
    });

    return NextResponse.json({ success: true, message: 'Notification marked as read' });
  } catch (error: any) {
    console.error('[NOTIFICATIONS_PUT]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update notification' },
      { status: 500 }
    );
  }
}
