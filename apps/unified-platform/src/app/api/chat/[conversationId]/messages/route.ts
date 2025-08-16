import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logger } from '../../../../../lib/production-logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get messages for the conversation
    const messages = await prisma.chatMessage.findMany({
      where: {
        conversationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Reverse to show oldest first
    const reversedMessages = messages.reverse();

    return NextResponse.json({
      messages: reversedMessages.map(message => ({
        id: message.id,
        conversationId: message.conversationId,
        senderId: message.senderId,
        receiverId: message.receiverId,
        message: message.content,
        type: message.type,
        timestamp: message.createdAt,
        metadata: message.metadata,
        sender: message.sender
      }))
    });
  } catch (error) {
    logger.error('Error fetching chat messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const { conversationId } = params;
    const body = await request.json();
    const { senderId, receiverId, message, type = 'text', metadata } = body;

    // Create new message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        conversationId,
        senderId,
        receiverId,
        content: message,
        type,
        metadata
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        }
      }
    });

    // Update conversation last activity
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastActivityAt: new Date() }
    });

    return NextResponse.json({
      message: {
        id: chatMessage.id,
        conversationId: chatMessage.conversationId,
        senderId: chatMessage.senderId,
        receiverId: chatMessage.receiverId,
        message: chatMessage.content,
        type: chatMessage.type,
        timestamp: chatMessage.createdAt,
        metadata: chatMessage.metadata,
        sender: chatMessage.sender
      }
    });
  } catch (error) {
    logger.error('Error creating chat message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}