import { NextRequest, NextResponse } from 'next/server';
import { notificationService } from '@/lib/notification-service';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unread') === 'true';

    const result = await notificationService.getUserNotifications(
      session.user.id,
      page,
      limit
    );

    // Filter by type if specified
    let filteredNotifications = result.notifications;
    if (type) {
      filteredNotifications = result.notifications.filter(n => n.type === type);
    }
    if (unreadOnly) {
      filteredNotifications = result.notifications.filter(n => !n.isRead);
    }

    return NextResponse.json({
      notifications: filteredNotifications,
      total: result.total,
      unreadCount: result.unreadCount,
      hasMore: result.hasMore,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { type, title, message, data, sendEmail } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      );
    }

    const notification = await notificationService.createNotification({
      userId: session.user.id,
      type,
      title,
      message,
      data,
      sendEmail,
    });

    return NextResponse.json(notification, { status: 201 });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}