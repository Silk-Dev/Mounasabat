import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/production-logger';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove the push subscription from the user's preferences
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { preferences: true },
    });

    const currentPreferences = (currentUser?.preferences as any) || {};
    const updatedPreferences = {
      ...currentPreferences,
      pushSubscription: null,
      pushNotifications: false,
    };

    await prisma.user.update({
      where: { id: session.user.id },
      data: { preferences: updatedPreferences },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error unsubscribing from push notifications:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    );
  }
}