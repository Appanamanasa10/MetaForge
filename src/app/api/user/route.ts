import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = (session.user as any).id;

    const body = await req.json();
    const { name } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ success: false, message: 'Name cannot be empty' }, { status: 400 });
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { name: name.trim() },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
      },
    });
  } catch (error: any) {
    console.error('[USER_PUT]', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update user profile' },
      { status: 500 }
    );
  }
}
