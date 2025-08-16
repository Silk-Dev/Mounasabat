import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '../../../../../../lib/production-logger';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  try {
    const { messageId } = await params;

    // Mark message as read
    await prisma.chatMessage.update({
      where: { id: messageId },
      data: { readAt: new Date() }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark message as read' },
      { status: 500 }
    );
  }
}