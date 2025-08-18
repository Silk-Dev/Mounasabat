import { NextRequest, NextResponse } from 'next/server';
// import { notificationService } from '@/lib/notification-service';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { logger } from '@/lib/production-logger';
import { notificationService } from '@/lib/notification-service';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await auth.api.getSession({headers: await headers()});
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await notificationService.markAsRead(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}